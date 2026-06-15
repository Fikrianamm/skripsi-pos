/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndNotifyLowStock, createNotificationForRole, JenisNotif } from "@/lib/notifications";

// ── GET /api/admin/inventory/out — List all PengeluaranBarang (Barang Keluar)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!["admin", "gudang"].includes(session.user.role || ""))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const spkId = searchParams.get("spkId") || "";
    const bahanBakuId = searchParams.get("bahanBakuId") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, any> = { deletedAt: null };

    if (search) {
      where.OR = [
        { spk: { order: { nomorOrder: { contains: search } } } },
        { spk: { order: { customer: { nama: { contains: search } } } } },
        { keterangan: { contains: search } },
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

    if (spkId) {
      where.spkId = spkId;
    }

    if (bahanBakuId) {
      where.items = { some: { bahanBakuId } };
    }

    const [results, total] = await Promise.all([
      prisma.pengeluaranBarang.findMany({
        where,
        take: limit,
        skip,
        orderBy: { tanggal: "desc" },
        include: {
          addedBy: { select: { id: true, name: true, image: true } },
          spk: {
            select: {
              id: true,
              order: { select: { nomorOrder: true, customer: { select: { nama: true } } } },
            },
          },
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
      prisma.pengeluaranBarang.count({ where }),
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
    console.error("[GET PENGELUARAN BARANG ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ── POST /api/admin/inventory/out — Catat Pengeluaran Barang Baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!["admin", "gudang"].includes(session.user.role || ""))
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await request.json();
    const { spkId, tanggal, keterangan, items } = body as {
      spkId?: string;
      tanggal?: string;
      keterangan?: string;
      items: { bahanBakuId: string; jumlah: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Daftar barang tidak boleh kosong." },
        { status: 400 },
      );
    }

    // Validate all bahanBaku IDs exist and have sufficient stock
    const bahanBakuIds = items.map((i) => i.bahanBakuId);
    const bahanBakuList = await prisma.bahanBaku.findMany({
      where: { id: { in: bahanBakuIds } },
      select: { id: true, nama: true, stok: true },
    });

    for (const item of items) {
      const bb = bahanBakuList.find((b) => b.id === item.bahanBakuId);
      if (!bb) {
        return NextResponse.json(
          { error: `Bahan baku tidak ditemukan.` },
          { status: 400 },
        );
      }
      if (Number(bb.stok) < Number(item.jumlah)) {
        return NextResponse.json(
          {
            error: `Stok ${bb.nama} tidak mencukupi. Stok saat ini: ${Number(bb.stok)}.`,
          },
          { status: 400 },
        );
      }
    }

    const pengeluaranId = crypto.randomUUID();
    const parsedItems = items.map((item) => ({
      id: crypto.randomUUID(),
      bahanBakuId: item.bahanBakuId,
      jumlah: Number(item.jumlah),
    }));

    // Execute transactionally: create header + detail + decrement stock
    const [pengeluaranBarang] = await prisma.$transaction([
      prisma.pengeluaranBarang.create({
        data: {
          id: pengeluaranId,
          spkId: spkId || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          keterangan: keterangan || null,
          addedById: session.user.id,
          items: {
            create: parsedItems.map((pi) => ({
              id: pi.id,
              bahanBakuId: pi.bahanBakuId,
              jumlah: pi.jumlah,
            })),
          },
        },
      }),
      ...parsedItems.map((pi) =>
        prisma.bahanBaku.update({
          where: { id: pi.bahanBakuId },
          data: { stok: { decrement: pi.jumlah } },
        }),
      ),
    ]);

    // ─── Fitur #4: Cek Stok Menipis (Bahan Baku) ───
    try {
      await Promise.all(
        parsedItems.map((pi) => checkAndNotifyLowStock(pi.bahanBakuId))
      );
    } catch (e) {
      console.error("Failed to check low stock:", e);
    }

    try {
      await createNotificationForRole(["admin", "gudang"], {
        title: "Pengeluaran Barang",
        message: `Pengeluaran barang baru saja dicatat dengan ${items.length} item.`,
        jenis: JenisNotif.BARANG_KELUAR,
        linkUrl: `/inventory/out`,
      });
    } catch (e) {
      console.error("Failed to notify barang keluar:", e);
    }

    return NextResponse.json(
      { message: "Pengeluaran barang berhasil dicatat.", pengeluaranBarang },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST PENGELUARAN BARANG ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
