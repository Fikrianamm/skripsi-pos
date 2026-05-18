import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/karyawan — List karyawan
export async function GET(request: NextRequest) {
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

    const ALLOWED_GET = ["admin", "produksi"];
    if (!ALLOWED_GET.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam && isActiveParam !== "all") {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.nama = { contains: search };
    }

    const [results, count] = await Promise.all([
      prisma.karyawan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.karyawan.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST KARYAWAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/karyawan — Tambah karyawan
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { nama, nomorHp, posisi } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama karyawan wajib diisi.", field: "nama" },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existing = await prisma.karyawan.findFirst({
      where: { nama: trimmedNama },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Karyawan dengan nama tersebut sudah terdaftar.",
          field: "nama",
        },
        { status: 400 },
      );
    }

    const newKaryawan = await prisma.karyawan.create({
      data: {
        id: crypto.randomUUID(),
        nama: trimmedNama,
        nomorHp: nomorHp?.trim() || null,
        posisi: posisi?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Karyawan berhasil ditambahkan.", karyawan: newKaryawan },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE KARYAWAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/karyawan — Bulk delete
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs karyawan wajib disertakan." },
        { status: 400 },
      );
    }

    await prisma.karyawan.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      message: `${ids.length} karyawan berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[ADMIN BULK DELETE KARYAWAN ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
