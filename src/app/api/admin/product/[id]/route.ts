import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/admin/product/[id] — Update product
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

    // Cek apakah produk ada
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 },
      );
    }

    // Validasi field wajib
    const missingFields: string[] = [];
    if (!sku) missingFields.push("sku");
    if (!nama) missingFields.push("nama");
    if (hpp === undefined || hpp === null || hpp === "")
      missingFields.push("hpp");
    if (hargaJual === undefined || hargaJual === null || hargaJual === "")
      missingFields.push("hargaJual");
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

    // Cek duplikat SKU (selain diri sendiri)
    const duplicateSku = await prisma.product.findFirst({
      where: { sku, id: { not: id } },
    });

    if (duplicateSku) {
      return NextResponse.json(
        { error: "SKU sudah digunakan produk lain.", field: "sku" },
        { status: 400 },
      );
    }

    // Validasi categoryId
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan.", field: "categoryId" },
        { status: 400 },
      );
    }

    // Validasi unitId
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Satuan tidak ditemukan.", field: "unitId" },
        { status: 400 },
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        sku,
        nama,
        image: image || null,
        hpp: parseFloat(hpp),
        hargaJual: parseFloat(hargaJual),
        stok:
          stok !== undefined && stok !== null && stok !== ""
            ? parseFloat(stok)
            : undefined,
        minStok:
          minStok !== undefined && minStok !== null && minStok !== ""
            ? parseFloat(minStok)
            : undefined,
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
        updatedAt: true,
        category: {
          select: { id: true, nama: true },
        },
        unit: {
          select: { id: true, nama: true },
        },
      },
    });

    return NextResponse.json({
      message: "Produk berhasil diperbarui.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("[ADMIN UPDATE PRODUCT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/product/[id] — Delete product
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: "Produk berhasil dipindahkan ke sampah.",
    });
  } catch (error) {
    console.error("[ADMIN DELETE PRODUCT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
