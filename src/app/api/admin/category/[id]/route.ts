import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/category/[id] — Update category
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { nama } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi.", missingFields: ["nama"] },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 },
      );
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "Nama kategori sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const updatedCategory = await prisma.category.update({
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
      message: "Kategori berhasil diperbarui.",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE CATEGORY ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/category/[id] — Delete category
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 },
      );
    }

    // Peringatan jika ada produk terkait
    if (existingCategory._count.products > 0) {
      const { searchParams } = new URL(request.url);
      const force = searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Kategori ini memiliki ${existingCategory._count.products} produk terkait. Tambahkan query ?force=true untuk tetap menghapus.`,
            productCount: existingCategory._count.products,
            requiresForce: true,
          },
          { status: 400 },
        );
      }
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kategori berhasil dihapus.",
    });
  } catch (error) {
    console.error("[ADMIN DELETE CATEGORY ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
