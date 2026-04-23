/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/product — List products
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const unitId = searchParams.get("unitId") || "";
    const isService = searchParams.get("isService");

    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (isService !== null && isService !== undefined && isService !== "") {
      where.isService = isService === "true";
    }

    const [results, count] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          nama: true,
          image: true,
          hpp: true,
          hargaJual: true,
          stok: true,
          minStok: true,
          isService: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, nama: true },
          },
          unit: {
            select: { id: true, nama: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST PRODUCT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/product — Create product
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
    const {
      sku,
      nama,
      image,
      hpp,
      hargaJual,
      stok,
      minStok,
      isService,
      categoryId,
      unitId,
    } = body;

    const missingFields: string[] = [];

    if (!sku) missingFields.push("sku");
    if (!nama) missingFields.push("nama");
    if (hpp === undefined || hpp === null || hpp === "")
      missingFields.push("hpp");
    if (hargaJual === undefined || hargaJual === null || hargaJual === "")
      missingFields.push("hargaJual");
    // stok dan minStok bersifat opsional (nullable di schema)
    if (isService === undefined || isService === null)
      missingFields.push("isService");
    if (!categoryId) missingFields.push("categoryId");
    if (!unitId) missingFields.push("unitId");

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

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan.", field: "categoryId" },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Satuan tidak ditemukan.", field: "unitId" },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "SKU sudah terdaftar.", field: "sku" },
        { status: 400 },
      );
    }

    const productId = crypto.randomUUID();

    const newProduct = await prisma.product.create({
      data: {
        id: productId,
        sku,
        nama,
        image: image || null,
        hpp: parseFloat(hpp),
        hargaJual: parseFloat(hargaJual),
        stok:
          stok !== undefined && stok !== null && stok !== ""
            ? parseFloat(stok)
            : null,
        minStok:
          minStok !== undefined && minStok !== null && minStok !== ""
            ? parseFloat(minStok)
            : null,
        isService: Boolean(isService),
        categoryId,
        unitId,
      },
      select: {
        id: true,
        sku: true,
        nama: true,
        image: true,
        hpp: true,
        hargaJual: true,
        stok: true,
        minStok: true,
        isService: true,
        createdAt: true,
        category: {
          select: { id: true, nama: true },
        },
        unit: {
          select: { id: true, nama: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Produk berhasil ditambahkan.",
        product: newProduct,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE PRODUCT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
