/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo } from "@/lib/storage";
import path from "path";
import { createJurnalDoubleEntry } from "@/lib/finance";
import { createNotificationForRole, checkAndNotifyLowStock } from "@/lib/notifications";
import { JenisNotif } from "../../../../../../generated/prisma/enums";

// ── GET /api/admin/inventory/in — List all PenerimaanBarang (Barang Masuk)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const bahanBakuId = searchParams.get("bahanBakuId") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, any> = { deletedAt: null };

    if (search) {
      where.OR = [
        { nomorFaktur: { contains: search } },
        { supplier: { nama: { contains: search } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.tanggal = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo
          ? { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }
          : {}),
      };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (bahanBakuId) {
      where.items = { some: { bahanBakuId } };
    }

    const [results, total] = await Promise.all([
      prisma.penerimaanBarang.findMany({
        where,
        take: limit,
        skip,
        orderBy: { tanggal: "desc" },
        include: {
          supplier: { select: { id: true, nama: true, image: true } },
          addedBy: { select: { id: true, name: true, image: true } },
          _count: { select: { items: true } },
          items: {
            select: {
              id: true,
              jumlah: true,
              bahanBaku: {
                select: { nama: true, unit: { select: { nama: true } } },
              },
            },
          },
        },
      }),
      prisma.penerimaanBarang.count({ where }),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET PENERIMAAN BARANG ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ── POST /api/admin/inventory/in — Catat Penerimaan Barang Baru (Multi-item)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const formData = await request.formData();

    // Header data
    const supplierId = formData.get("supplierId") as string | null;
    const nomorFaktur = formData.get("nomorFaktur") as string | null;
    const tanggal = formData.get("tanggal") as string | null;
    const keterangan = formData.get("keterangan") as string | null;
    const itemsRaw = formData.get("items") as string;
    const buktiNotaFile = formData.get("buktiNota") as File | null;

    if (!itemsRaw) {
      return NextResponse.json(
        { error: "Daftar barang tidak boleh kosong." },
        { status: 400 },
      );
    }

    let items;
    try {
      items = JSON.parse(itemsRaw);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Invalid items array");
      }
    } catch {
      return NextResponse.json(
        { error: "Format barang tidak valid." },
        { status: 400 },
      );
    }

    // Hitung total tagihan dari item
    let totalTagihan = 0;
    const parsedItems = items.map(
      (item: {
        bahanBakuId: string;
        jumlah: string | number;
        hargaBeli?: string | number;
      }) => {
        const q = Number(item.jumlah);
        const p = Number(item.hargaBeli) || 0;
        const totalHargaItem = q * p;
        totalTagihan += totalHargaItem;
        return {
          id: crypto.randomUUID(),
          bahanBakuId: item.bahanBakuId,
          jumlah: q,
          hargaBeli: p,
          totalHargaItem,
        };
      },
    );

    // Upload file if present
    const penerimaanId = crypto.randomUUID();
    let fileUrl: string | null = null;

    if (buktiNotaFile && buktiNotaFile.size > 0) {
      const ext = path.extname(buktiNotaFile.name) || "";
      const s3Key = `penerimaan/${penerimaanId}/nota${ext}`;
      const buffer = Buffer.from(await buktiNotaFile.arrayBuffer());

      fileUrl = await uploadToNeo({
        key: s3Key,
        body: buffer,
        contentType: buktiNotaFile.type,
      });
    }

    // Execute transactional queries
    const penerimaanBarang = await prisma.$transaction(async (tx) => {
      // 1. Create header + detail items
      const penerimaan = await tx.penerimaanBarang.create({
        data: {
          id: penerimaanId,
          nomorFaktur: nomorFaktur || null,
          supplierId: supplierId || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          keterangan: keterangan || null,
          buktiNota: fileUrl,
          totalTagihan,
          addedById: session.user.id,
          items: {
            create: parsedItems.map((pi) => ({
              id: pi.id,
              bahanBakuId: pi.bahanBakuId,
              jumlah: pi.jumlah,
              hargaBeli: pi.hargaBeli,
              totalHargaItem: pi.totalHargaItem,
            })),
          },
        },
      });

      // 2. Update stok bahan baku
      for (const pi of parsedItems) {
        await tx.bahanBaku.update({
          where: { id: pi.bahanBakuId },
          data: { stok: { increment: pi.jumlah } },
        });
      }

      // 3. Catat Jurnal Umum otomatis (jika total tagihan > 0)
      //    Debet = HPP / Persediaan Bahan Baku (5-001)
      //    Kredit = Hutang Usaha (2-001)
      if (totalTagihan > 0) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const [hppAkun, hutangAkun] = await Promise.all([
          tx.akun.findUnique({ where: { kodeAkun: "5-001" } }),
          tx.akun.findUnique({ where: { kodeAkun: "2-001" } }),
        ]);

        if (hppAkun && hutangAkun) {
          const realTanggal = tanggal ? new Date(tanggal) : new Date();
          await createJurnalDoubleEntry(
            {
              ref:          `INV-${penerimaanId.slice(0, 5)}`,
              tanggal:      realTanggal,
              keterangan:   `Penerimaan Barang${nomorFaktur ? ` #${nomorFaktur}` : ""} - Total ${totalTagihan.toLocaleString("id-ID")}`,
              akunDebetId:  hppAkun.id,
              akunKreditId: hutangAkun.id,
              nominal:      totalTagihan,
              penerimaanId: penerimaanId,
              createdById:  session.user.id,
            },
            tx as any,
          );
        }
      }

      return penerimaan;
    });

    // Notify Admins & Gudang about new inventory reception (Fitur #1)
    try {
      const supplier = supplierId ? await prisma.supplier.findUnique({ where: { id: supplierId } }) : null;
      const notifInput = {
        title: "Penerimaan Barang Baru",
        message: `Penerimaan barang${nomorFaktur ? ` #${nomorFaktur}` : ""}${supplier ? ` dari ${supplier.nama}` : ""} senilai ${totalTagihan.toLocaleString("id-ID")} telah dicatat.`,
        jenis: JenisNotif.PENERIMAAN_BARU,
        linkUrl: "/inventory/in",
      };
      await Promise.all([
        createNotificationForRole("admin", notifInput),
        createNotificationForRole("gudang", notifInput),
      ]);
    } catch (e) {
      console.error("Failed to send notification:", e);
    }

    // ─── Fitur #4: Cek Stok Menipis (Bahan Baku) ───
    try {
      await Promise.all(
        parsedItems.map((pi: any) => checkAndNotifyLowStock(pi.bahanBakuId))
      );
    } catch (e) {
      console.error("Failed to check low stock:", e);
    }

    return NextResponse.json(
      { message: "Penerimaan barang berhasil dicatat.", penerimaanBarang },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST PENERIMAAN BARANG ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
