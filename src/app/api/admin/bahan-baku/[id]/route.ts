import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/bahan-baku/[id] — Update bahan baku
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await request.json();
    const { nama, unitId, stok, minStok, keterangan, isActive } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama wajib diisi.", field: "nama" },
        { status: 400 },
      );
    }
    if (!unitId || typeof unitId !== "string" || unitId.trim().length === 0) {
      return NextResponse.json(
        { error: "Satuan wajib diisi.", field: "unitId" },
        { status: 400 },
      );
    }

    const existing = await prisma.bahanBaku.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Bahan baku tidak ditemukan." },
        { status: 404 },
      );
    }

    const duplicate = await prisma.bahanBaku.findFirst({
      where: { nama: nama.trim(), id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Bahan baku dengan nama ini sudah ada.", field: "nama" },
        { status: 400 },
      );
    }

    const updated = await prisma.bahanBaku.update({
      where: { id },
      data: {
        nama: nama.trim(),
        unitId: unitId.trim(),
        stok: stok !== undefined ? Number(stok) : existing.stok,
        minStok:
          minStok !== undefined
            ? minStok === "" || minStok === null
              ? null
              : Number(minStok)
            : existing.minStok,
        keterangan:
          keterangan !== undefined ? keterangan || null : existing.keterangan,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      message: "Bahan baku berhasil diperbarui.",
      bahanBaku: updated,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE BAHAN BAKU ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/bahan-baku/[id] — Delete single bahan baku
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const existing = await prisma.bahanBaku.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Bahan baku tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.bahanBaku.delete({ where: { id } });

    return NextResponse.json({ message: "Bahan baku berhasil dihapus." });
  } catch (error) {
    console.error("[ADMIN DELETE BAHAN BAKU ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
