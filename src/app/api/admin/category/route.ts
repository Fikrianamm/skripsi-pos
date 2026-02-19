import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/category — List categories
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

    if (session.user.role !== "admin") {
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

    if (search) {
      where.nama = { contains: search };
    }

    const [results, count] = await Promise.all([
      prisma.category.findMany({
        where,
        select: {
          id: true,
          nama: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST CATEGORY ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/category — Create category
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
    const { nama } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Field wajib diisi.",
          missingFields: ["nama"],
          message: "Field berikut wajib diisi: nama",
        },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();

    const existingCategory = await prisma.category.findFirst({
      where: { nama: trimmedNama },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Nama kategori sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const categoryId = crypto.randomUUID();

    const newCategory = await prisma.category.create({
      data: {
        id: categoryId,
        nama: trimmedNama,
      },
      select: {
        id: true,
        nama: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Kategori berhasil ditambahkan.",
        category: newCategory,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE CATEGORY ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
