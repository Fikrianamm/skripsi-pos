import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/customer — List customers
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) where.nama = { contains: search };

    const [results, count] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          orders: {
            select: {
              id: true,
              nomorOrder: true,
              grandTotal: true,
              createdAt: true,
              statusPembayaran: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Transform: compute firstOrder, totalOrder, totalSpend
    const transformedResults = results.map((customer) => {
      const orders = customer.orders ?? [];
      const firstOrder = orders.length > 0 ? orders[0] : null;
      const totalOrder = orders.length;
      const totalSpend = orders.reduce(
        (sum, o) => sum + Number(o.grandTotal),
        0,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { orders: _orders, ...rest } = customer;
      return { ...rest, firstOrder, totalOrder, totalSpend };
    });

    return NextResponse.json({
      results: transformedResults,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/customer — Create customer
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { nama, nomorHp, image } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json(
        { error: "Field wajib diisi.", missingFields: ["nama"] },
        { status: 400 },
      );
    }
    if (
      !nomorHp ||
      typeof nomorHp !== "string" ||
      nomorHp.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Field wajib diisi.", missingFields: ["nomorHp"] },
        { status: 400 },
      );
    }

    const trimmedNama = nama.trim();
    const existing = await prisma.customer.findFirst({
      where: { nama: trimmedNama },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Customer sudah terdaftar.", field: "nama" },
        { status: 400 },
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        nama: trimmedNama,
        nomorHp,
        image: image || null,
      },
    });

    return NextResponse.json(
      { message: "Customer berhasil ditambahkan.", customer: newCustomer },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/customer — Bulk delete customers
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
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
        { error: "IDs customer wajib disertakan." },
        { status: 400 },
      );
    }

    await prisma.customer.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({
      message: `${ids.length} customer berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[ADMIN BULK DELETE CUSTOMER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
