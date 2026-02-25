import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/unit/[id] — Update unit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { nama } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama satuan wajib diisi.", missingFields: ["nama"] },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existingUnit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Satuan tidak ditemukan." },
        { status: 404 },
      );
    }

    const duplicateUnit = await prisma.unit.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });

    if (duplicateUnit) {
      return NextResponse.json(
        { error: "Nama satuan sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { nama: trimmedNama },
      select: {
        id: true,
        nama: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Satuan berhasil diperbarui.",
      unit: updatedUnit,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE UNIT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/unit/[id] — Delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existingUnit = await prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Satuan tidak ditemukan." },
        { status: 404 },
      );
    }

    // Peringatan jika ada produk terkait
    if (existingUnit._count.products > 0) {
      const { searchParams } = new URL(request.url);
      const force = searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Satuan ini memiliki ${existingUnit._count.products} produk terkait. Tambahkan query ?force=true untuk tetap menghapus.`,
            productCount: existingUnit._count.products,
            requiresForce: true,
          },
          { status: 400 },
        );
      }
    }

    await prisma.unit.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Satuan berhasil dihapus.",
    });
  } catch (error) {
    console.error("[ADMIN DELETE UNIT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
