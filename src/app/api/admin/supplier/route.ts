import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/supplier — List suppliers
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
    const fetchAll = searchParams.get("all") === "true";
    const search = searchParams.get("search") || "";

    const skip = fetchAll ? undefined : (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam && isActiveParam !== "all") {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.nama = { contains: search };
    }

    const [results, count] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { nama: "asc" },
        skip,
        take: fetchAll ? undefined : limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST SUPPLIER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/supplier — Create supplier
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
    const { nama, nomorHp, email, alamat, keterangan, image } = body;

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

    const existingSupplier = await prisma.supplier.findFirst({
      where: { nama: trimmedNama },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const supplierId = crypto.randomUUID();

    const newSupplier = await prisma.supplier.create({
      data: {
        id: supplierId,
        nama: trimmedNama,
        nomorHp,
        email,
        alamat,
        keterangan,
        image: image || null,
      },
    });

    return NextResponse.json(
      {
        message: "Supplier berhasil ditambahkan.",
        supplier: newSupplier,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE SUPPLIER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/supplier — Bulk delete suppliers
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
        { error: "IDs supplier wajib disertakan." },
        { status: 400 },
      );
    }

    await prisma.supplier.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      message: `${ids.length} supplier berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[ADMIN BULK DELETE SUPPLIER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
