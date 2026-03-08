import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo } from "@/lib/storage";
import path from "path";

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

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nomorFaktur: { contains: search } },
            { supplier: { nama: { contains: search } } },
          ],
        }
      : {};

    const [results, total] = await Promise.all([
      prisma.penerimaanBarang.findMany({
        where,
        take: limit,
        skip,
        orderBy: { tanggal: "desc" },
        include: {
          supplier: { select: { id: true, nama: true } },
          addedBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
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
        hargaSatuan?: string | number;
      }) => {
        const q = Number(item.jumlah);
        const p = Number(item.hargaSatuan) || 0;
        const totalHargaItem = q * p;
        totalTagihan += totalHargaItem;
        return {
          id: crypto.randomUUID(),
          bahanBakuId: item.bahanBakuId,
          jumlah: q,
          hargaSatuan: p,
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
    const [penerimaanBarang] = await prisma.$transaction([
      // 1. Create header
      prisma.penerimaanBarang.create({
        data: {
          id: penerimaanId,
          nomorFaktur: nomorFaktur || null,
          supplierId: supplierId || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          keterangan: keterangan || null,
          buktiNota: fileUrl,
          totalTagihan,
          addedById: session.user.id,
          // 2. Create detail items using nested writes
          items: {
            create: parsedItems.map((pi) => ({
              id: pi.id,
              bahanBakuId: pi.bahanBakuId,
              jumlah: pi.jumlah,
              hargaSatuan: pi.hargaSatuan,
              totalHargaItem: pi.totalHargaItem,
            })),
          },
        },
      }),

      // 3. Update stock for each bahan baku using Prisma updateMany where possible,
      // or map over each item since Prisma doesn't support bulk updates with arithmetic increments directly easily yet,
      // we'll run multiple updates concurrently in the transaction array.
      ...parsedItems.map((pi) =>
        prisma.bahanBaku.update({
          where: { id: pi.bahanBakuId },
          data: { stok: { increment: pi.jumlah } },
        }),
      ),
    ]);

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
