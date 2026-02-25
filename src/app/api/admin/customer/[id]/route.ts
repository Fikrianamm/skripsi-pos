import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/customer/[id] — Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
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
    const { nama, nomorHp, image } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    }
    if (
      !nomorHp ||
      typeof nomorHp !== "string" ||
      nomorHp.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Nomor HP wajib diisi." },
        { status: 400 },
      );
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    const trimmedNama = nama.trim();
    const duplicate = await prisma.customer.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Customer sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        nama: trimmedNama,
        nomorHp,
        image: image !== undefined ? image : existing.image,
      },
    });

    return NextResponse.json({
      message: "Customer berhasil diperbarui.",
      customer: updated,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/customer/[id] — Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
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
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ message: "Customer berhasil dihapus." });
  } catch (error) {
    console.error("[ADMIN DELETE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
