import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/bahan-baku — List bahan baku
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session)
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );

    if (session.user.role !== "admin")
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isActiveParam = searchParams.get("isActive");
    const stokFilter = searchParams.get("stokFilter"); // "menipis" | "habis" | "all"

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (isActiveParam && isActiveParam !== "all") {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.nama = { contains: search };
    }

    const [results, count] = await Promise.all([
      prisma.bahanBaku.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          unit: { select: { id: true, nama: true } },
          _count: { select: { stokMasuk: true } },
        },
      }),
      prisma.bahanBaku.count({ where }),
    ]);

    // Post-filter stok jika diperlukan (setelah query karena Decimal comparison)
    let filtered = results;
    if (stokFilter === "habis") {
      filtered = results.filter((b) => Number(b.stok) <= 0);
    } else if (stokFilter === "menipis") {
      filtered = results.filter(
        (b) =>
          b.minStok !== null &&
          Number(b.stok) > 0 &&
          Number(b.stok) <= Number(b.minStok),
      );
    }

    return NextResponse.json({
      results: filtered,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST BAHAN BAKU ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/bahan-baku — Create bahan baku
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session)
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );

    if (session.user.role !== "admin")
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );

    const body = await request.json();
    const { nama, unitId, stok, minStok, keterangan } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama bahan baku wajib diisi.", field: "nama" },
        { status: 400 },
      );
    }
    if (!unitId || typeof unitId !== "string" || unitId.trim().length === 0) {
      return NextResponse.json(
        { error: "Satuan wajib diisi.", field: "unitId" },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existing = await prisma.bahanBaku.findFirst({
      where: { nama: trimmedNama },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bahan baku dengan nama ini sudah ada.", field: "nama" },
        { status: 400 },
      );
    }

    const newBahanBaku = await prisma.bahanBaku.create({
      data: {
        id: crypto.randomUUID(),
        nama: trimmedNama,
        unitId: unitId.trim(),
        stok: stok ? Number(stok) : 0,
        minStok: minStok ? Number(minStok) : null,
        keterangan: keterangan || null,
      },
    });

    return NextResponse.json(
      { message: "Bahan baku berhasil ditambahkan.", bahanBaku: newBahanBaku },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE BAHAN BAKU ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/bahan-baku — Bulk delete
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session)
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );

    if (session.user.role !== "admin")
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs bahan baku wajib disertakan." },
        { status: 400 },
      );
    }

    await prisma.bahanBaku.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      message: `${ids.length} bahan baku berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[ADMIN BULK DELETE BAHAN BAKU ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
