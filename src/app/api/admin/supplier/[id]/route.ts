import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/supplier/[id] — Update supplier
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
    const { nama, nomorHp, email, alamat, keterangan, isActive, image } = body;

    const missingFields: string[] = [];

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      missingFields.push("nama");
    }

    if (
      !nomorHp ||
      typeof nomorHp !== "string" ||
      nomorHp.trim().length === 0
    ) {
      missingFields.push("nomorHp");
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Field wajib diisi.",
          missingFields,
          message: `Field berikut wajib diisi: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan." },
        { status: 404 },
      );
    }

    const duplicateSupplier = await prisma.supplier.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });

    if (duplicateSupplier) {
      return NextResponse.json(
        { error: "Supplier sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        nama: trimmedNama,
        nomorHp,
        email: email ?? existingSupplier.email,
        alamat,
        keterangan,
        isActive: isActive !== undefined ? isActive : existingSupplier.isActive,
        image: image !== undefined ? image : existingSupplier.image,
      },
    });

    return NextResponse.json({
      message: "Supplier berhasil diperbarui.",
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE SUPPLIER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/supplier/[id] — Delete supplier
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

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan." },
        { status: 404 },
      );
    }

    // Peringatan jika ada produk terkait
    // if (existingSupplier._count.products > 0) {
    //   const { searchParams } = new URL(request.url);
    //   const force = searchParams.get("force") === "true";
    //   if (!force) {
    //     return NextResponse.json(
    //       {
    //         error: `Supplier ini memiliki ${existingSupplier._count.products} produk terkait. Tambahkan query ?force=true untuk tetap menghapus.`,
    //         productCount: existingSupplier._count.products,
    //         requiresForce: true,
    //       },
    //       { status: 400 },
    //     );
    //   }
    // }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Supplier berhasil dihapus.",
    });
  } catch (error) {
    console.error("[ADMIN DELETE SUPPLIER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
