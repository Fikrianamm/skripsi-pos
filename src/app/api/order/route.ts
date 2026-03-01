import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Shared auth guard: admin or kasir only
async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return {
      error: "Unauthorized. Silakan login terlebih dahulu.",
      status: 401,
      session: null,
    };
  if (session.user.role !== "admin" && session.user.role !== "kasir") {
    return {
      error: "Forbidden. Anda tidak memiliki akses.",
      status: 403,
      session: null,
    };
  }
  return { error: null, status: 200, session };
}

// Generate "ORD-YYYYMMDD-XXXX" order number
async function generateNomorOrder(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { nomorOrder: { startsWith: prefix } },
    orderBy: { nomorOrder: "desc" },
    select: { nomorOrder: true },
  });

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.nomorOrder.split("-");
    seq = parseInt(parts[parts.length - 1] || "0", 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ─── GET /api/order — List orders ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const statusProduksi = searchParams.get("statusProduksi") || "";
    const statusPembayaran = searchParams.get("statusPembayaran") || "";
    const customerId = searchParams.get("customerId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nomorOrder: { contains: search } },
        { customer: { nama: { contains: search } } },
      ];
    }
    if (statusProduksi) where.statusProduksi = statusProduksi;
    if (statusPembayaran) where.statusPembayaran = statusPembayaran;
    if (customerId) where.customerId = customerId;

    // Sort: deadline asc nulls-last, or createdAt desc (default)
    const orderBy =
      sortBy === "deadline"
        ? [
            { deadline: { sort: "asc" as const, nulls: "last" as const } },
            { createdAt: "desc" as const },
          ]
        : [{ createdAt: "desc" as const }];

    const [results, count] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          nomorOrder: true,
          channel: true,
          statusProduksi: true,
          statusPembayaran: true,
          metodePembayaran: true,
          deadline: true,
          subtotal: true,
          diskon: true,
          ongkir: true,
          grandTotal: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: { id: true, nama: true, nomorHp: true, image: true },
          },
          _count: { select: { items: true, designFiles: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ORDER LIST ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ─── POST /api/order — Create order ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { error, status } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const {
      customerId,
      channel,
      statusPembayaran,
      metodePembayaran,
      deadline,
      catatan,
      diskon,
      ongkir,
      subtotal,
      grandTotal,
      items,
    } = body;

    // Validasi field wajib
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer wajib dipilih." },
        { status: 400 },
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Pesanan harus memiliki minimal satu item." },
        { status: 400 },
      );
    }
    if (subtotal === undefined || grandTotal === undefined) {
      return NextResponse.json(
        { error: "Subtotal dan grandTotal wajib diisi." },
        { status: 400 },
      );
    }

    // Pastikan customer ada
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    // Validasi semua produk ada
    const productIds: string[] = items.map(
      (i: { productId: string }) => i.productId,
    );
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "Satu atau lebih produk tidak ditemukan." },
        { status: 400 },
      );
    }

    const nomorOrder = await generateNomorOrder();
    const orderId = crypto.randomUUID();

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerId,
        nomorOrder,
        channel: channel || "LANGSUNG",
        statusProduksi: "PENDING",
        statusPembayaran: statusPembayaran || "BELUM_BAYAR",
        metodePembayaran: metodePembayaran || "TUNAI",
        deadline: deadline ? new Date(deadline) : null,
        catatan: catatan || null,
        diskon: diskon ?? 0,
        ongkir: ongkir ?? null,
        subtotal: subtotal,
        grandTotal: grandTotal,
        items: {
          create: items.map(
            (item: {
              productId: string;
              nama: string;
              harga: number;
              qty: number;
              subtotal: number;
              catatan?: string;
            }) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              nama: item.nama,
              harga: item.harga,
              qty: item.qty,
              subtotal: item.subtotal,
              catatan: item.catatan || null,
            }),
          ),
        },
      },
      select: {
        id: true,
        nomorOrder: true,
        channel: true,
        statusProduksi: true,
        statusPembayaran: true,
        metodePembayaran: true,
        deadline: true,
        catatan: true,
        subtotal: true,
        diskon: true,
        ongkir: true,
        grandTotal: true,
        createdAt: true,
        customer: { select: { id: true, nama: true, nomorHp: true } },
        items: {
          select: {
            id: true,
            productId: true,
            nama: true,
            harga: true,
            qty: true,
            subtotal: true,
            catatan: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Pesanan berhasil dibuat.", order },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ORDER CREATE ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
