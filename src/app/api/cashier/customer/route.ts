import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cashier/customer — List customers
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

    if (session.user.role !== "admin" && session.user.role !== "kasir") {
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
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          nama: true,
          nomorHp: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[CASHIER LIST CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/cashier/customer — Create customer
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

    if (session.user.role !== "admin" && session.user.role !== "kasir") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

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

    const existingCustomer = await prisma.customer.findFirst({
      where: { nama: trimmedNama },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const customerId = crypto.randomUUID();

    const newCustomer = await prisma.customer.create({
      data: {
        id: customerId,
        nama: trimmedNama,
        nomorHp,
      },
      select: {
        id: true,
        nama: true,
        nomorHp: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Customer berhasil ditambahkan.",
        customer: newCustomer,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CASHIER CREATE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
