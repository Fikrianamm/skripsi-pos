import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/karyawan/[id] — Update karyawan
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
    const { nama, nomorHp, posisi, isActive } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama karyawan wajib diisi.", field: "nama" },
        { status: 400 },
      );
    }

    const existing = await prisma.karyawan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan." },
        { status: 404 },
      );
    }

    const trimmedNama = nama.trim();

    const duplicate = await prisma.karyawan.findFirst({
      where: { nama: trimmedNama, id: { not: id } },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: "Karyawan dengan nama tersebut sudah terdaftar.",
          field: "nama",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.karyawan.update({
      where: { id },
      data: {
        nama: trimmedNama,
        nomorHp: nomorHp?.trim() || null,
        posisi: posisi?.trim() || null,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      message: "Karyawan berhasil diperbarui.",
      karyawan: updated,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE KARYAWAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/karyawan/[id] — Hapus satu karyawan
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

    const existing = await prisma.karyawan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan." },
        { status: 404 },
      );
    }

    // Cek apakah karyawan ini masih punya SPK aktif
    const aktivSPK = await prisma.sPK.count({
      where: { karyawanId: id, statusSPK: "AKTIF" },
    });

    if (aktivSPK > 0) {
      return NextResponse.json(
        {
          error: `Karyawan ini masih memiliki ${aktivSPK} SPK aktif dan tidak dapat dihapus.`,
        },
        { status: 400 },
      );
    }

    await prisma.karyawan.delete({ where: { id } });

    return NextResponse.json({ message: "Karyawan berhasil dihapus." });
  } catch (error) {
    console.error("[ADMIN DELETE KARYAWAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
