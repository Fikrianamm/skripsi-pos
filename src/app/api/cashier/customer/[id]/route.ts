import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/cashier/customer/[id] — Update customer
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

    if (session.user.role !== "admin" && session.user.role !== "kasir") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { nama, nomorHp } = body;

    const missingFields: string[] = [];

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      missingFields.push("nama");
    }

    if (!nomorHp || typeof nomorHp !== "string" || nomorHp.trim().length === 0) {
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

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    const duplicateCustomer = await prisma.customer.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        { error: "Customer sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { nama: trimmedNama, nomorHp },
      select: {
        id: true,
        nama: true,
        nomorHp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Customer berhasil diperbarui.",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("[CASHIER UPDATE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/cashier/customer/[id] — Delete customer
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

    if (session.user.role !== "admin" && session.user.role !== "kasir") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    // Peringatan jika ada data terkait
    // if (existingCustomer._count.products > 0) {
    //   const { searchParams } = new URL(request.url);
    //   const force = searchParams.get("force") === "true";
    //   if (!force) {
    //     return NextResponse.json(
    //       {
    //         error: `Customer ini memiliki ${existingCustomer._count.products} produk terkait. Tambahkan query ?force=true untuk tetap menghapus.`,
    //         productCount: existingCustomer._count.products,
    //         requiresForce: true,
    //       },
    //       { status: 400 },
    //     );
    //   }
    // }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Customer berhasil dihapus.",
    });
  } catch (error) {
    console.error("[CASHIER DELETE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
