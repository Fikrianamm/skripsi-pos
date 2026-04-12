import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// Full order select (used in GET detail)
const ORDER_DETAIL_SELECT = {
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
  updatedAt: true,
  customer: { select: { id: true, nama: true, nomorHp: true, image: true } },
  items: {
    select: {
      id: true,
      productId: true,
      nama: true,
      harga: true,
      qty: true,
      subtotal: true,
      catatan: true,
      product: { select: { id: true, sku: true, nama: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  designFiles: {
    select: {
      id: true,
      nama: true,
      filePath: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  spk: {
    select: {
      id: true,
      orderId: true,
      karyawanId: true,
      tahapProduksi: true,
      model: true,
      tali: true,
      ukuran: true,
      jumlah: true,
      catatan: true,
      tanggalSetor: true,
      accCetak: true,
      accCetakAt: true,
      accCetakOleh: true,
      statusSPK: true,
      createdAt: true,
      karyawan: { select: { id: true, nama: true, posisi: true } },
    },
  },
} as const;

async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return {
      error: "Unauthorized.",
      status: 401,
      session: null,
      isAdmin: false,
    };
  const ALLOWED = ["admin", "kasir", "designer"];
  if (!session.user.role || !ALLOWED.includes(session.user.role)) {
    return {
      error: "Forbidden. Anda tidak memiliki akses.",
      status: 403,
      session: null,
      isAdmin: false,
    };
  }
  return {
    error: null,
    status: 200,
    session,
    isAdmin: session.user.role === "admin",
  };
}

// ─── GET /api/order/[id] — Order detail ───────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: ORDER_DETAIL_SELECT,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[ORDER DETAIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/order/[id] — Update order ─────────────────────────────────────
// Admin: semua field bisa diubah
// Kasir: hanya status, pembayaran, catatan, deadline
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { error, status, isAdmin } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, statusProduksi: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      // Semua role
      statusProduksi,
      statusPembayaran,
      metodePembayaran,
      catatan,
      deadline,
      diskon,
      ongkir,
      // Admin only
      customerId,
      channel,
      items,
    } = body;

    // Kasir hanya boleh update kolom tertentu
    if (
      !isAdmin &&
      (customerId !== undefined || channel !== undefined || items !== undefined)
    ) {
      return NextResponse.json(
        {
          error:
            "Kasir tidak dapat mengubah customer, channel, atau item pesanan.",
        },
        { status: 403 },
      );
    }

    // Validasi statusProduksi jika dikirim
    const VALID_STATUS_PRODUKSI = [
      "PENDING",
      "DESAIN",
      "PRODUKSI",
      "PACKING",
      "SELESAI",
      "BATAL",
    ];
    if (statusProduksi && !VALID_STATUS_PRODUKSI.includes(statusProduksi)) {
      return NextResponse.json(
        { error: "Status produksi tidak valid." },
        { status: 400 },
      );
    }

    const VALID_STATUS_BAYAR = ["BELUM_BAYAR", "DP", "LUNAS", "REFUND"];
    if (statusPembayaran && !VALID_STATUS_BAYAR.includes(statusPembayaran)) {
      return NextResponse.json(
        { error: "Status pembayaran tidak valid." },
        { status: 400 },
      );
    }

    // Jika items diupdate (admin only), recalculate totals
    let recalcData: { subtotal?: number; grandTotal?: number } = {};
    if (isAdmin && Array.isArray(items) && items.length > 0) {
      const newSubtotal = items.reduce(
        (sum: number, i: { harga: number; qty: number }) =>
          sum + i.harga * i.qty,
        0,
      );
      const newDiskon = diskon ?? 0;
      const newOngkir = ongkir ?? 0;
      recalcData = {
        subtotal: newSubtotal,
        grandTotal: Math.max(0, newSubtotal - newDiskon + newOngkir),
      };
    }

    // Build update data
    type UpdateData = Record<string, unknown>;
    const data: UpdateData = {};
    if (statusProduksi !== undefined) data.statusProduksi = statusProduksi;
    if (statusPembayaran !== undefined)
      data.statusPembayaran = statusPembayaran;
    if (metodePembayaran !== undefined)
      data.metodePembayaran = metodePembayaran;
    if (catatan !== undefined) data.catatan = catatan || null;
    if (deadline !== undefined)
      data.deadline = deadline ? new Date(deadline) : null;
    if (diskon !== undefined) data.diskon = diskon;
    if (ongkir !== undefined) data.ongkir = ongkir ?? null;
    if (recalcData.subtotal !== undefined) data.subtotal = recalcData.subtotal;
    if (recalcData.grandTotal !== undefined)
      data.grandTotal = recalcData.grandTotal;

    // Admin-only fields
    if (isAdmin) {
      if (customerId !== undefined) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        if (!customer)
          return NextResponse.json(
            { error: "Customer tidak ditemukan." },
            { status: 404 },
          );
        data.customerId = customerId;
      }
      if (channel !== undefined) data.channel = channel;
    }

    // Update order
    const updated = await prisma.order.update({
      where: { id },
      data,
      select: ORDER_DETAIL_SELECT,
    });

    // Replace items jika admin mengirimkan items baru (full replace)
    if (isAdmin && Array.isArray(items) && items.length > 0) {
      await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: id } }),
        prisma.orderItem.createMany({
          data: items.map(
            (item: {
              productId: string;
              nama: string;
              harga: number;
              qty: number;
              subtotal: number;
              catatan?: string;
            }) => ({
              id: crypto.randomUUID(),
              orderId: id,
              productId: item.productId,
              nama: item.nama,
              harga: item.harga,
              qty: item.qty,
              subtotal: item.subtotal,
              catatan: item.catatan || null,
            }),
          ),
        }),
      ]);
    }

    // Re-fetch dengan items terbaru jika items berubah
    const finalOrder =
      isAdmin && Array.isArray(items)
        ? await prisma.order.findUnique({
            where: { id },
            select: ORDER_DETAIL_SELECT,
          })
        : updated;

    return NextResponse.json({
      message: "Pesanan berhasil diperbarui.",
      order: finalOrder,
    });
  } catch (error) {
    console.error("[ORDER UPDATE ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/order/[id] — Cancel/delete order (admin only) ────────────────
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { error, status, isAdmin } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menghapus pesanan." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { id: true, nomorOrder: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    // OrderItem dan DesignFile akan terhapus cascade (sesuai schema)
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({
      message: `Pesanan ${existing.nomorOrder} berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[ORDER DELETE ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
