/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

type Params = { params: Promise<{ id: string }> };

async function requireCashierOrAdminAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      error: "Unauthorized. Silakan login terlebih dahulu.",
      status: 401,
      session: null,
    };
  }
  const ALLOWED = ["admin", "kasir"];
  if (!session.user.role || !ALLOWED.includes(session.user.role)) {
    return {
      error: "Forbidden. Hanya kasir atau admin yang dapat menyepakati harga.",
      status: 403,
      session: null,
    };
  }
  return { error: null, status: 200, session };
}

// PATCH /api/order/[id]/harga — Kasir konfirmasi harga final item custom
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireCashierOrAdminAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const body = await req.json();
    const { orderItemId, harga } = body;

    if (!orderItemId) {
      return NextResponse.json(
        { error: "orderItemId wajib diisi." },
        { status: 400 },
      );
    }

    if (harga === undefined || harga === null || isNaN(Number(harga)) || Number(harga) < 0) {
      return NextResponse.json(
        { error: "Harga wajib diisi dengan nominal valid (>= 0)." },
        { status: 400 },
      );
    }

    // Periksa orderItem dan order
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: orderItemId, orderId, deletedAt: null },
      include: {
        order: { select: { id: true, nomorOrder: true, diskon: true, ongkir: true } },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Item pesanan tidak ditemukan pada order ini." },
        { status: 404 },
      );
    }

    const finalHarga = Number(harga);
    const finalSubtotal = finalHarga * Number(orderItem.qty);

    // Update orderItem dan hitung ulang subtotal & grandTotal order dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update orderItem
      const updatedItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          harga: finalHarga,
          subtotal: finalSubtotal,
          statusHarga: "DISEPAKATI",
        },
      });

      // 2. Ambil seluruh item aktif untuk hitung ulang subtotal order
      const allActiveItems = await tx.orderItem.findMany({
        where: { orderId, deletedAt: null },
        select: { subtotal: true },
      });

      const orderSubtotal = allActiveItems.reduce(
        (acc, item) => acc + Number(item.subtotal || 0),
        0,
      );

      const diskon = Number(orderItem.order.diskon || 0);
      const ongkir = Number(orderItem.order.ongkir || 0);
      const grandTotal = Math.max(0, orderSubtotal - diskon + ongkir);

      // 3. Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: orderSubtotal,
          grandTotal: grandTotal,
        },
        select: {
          id: true,
          nomorOrder: true,
          subtotal: true,
          diskon: true,
          ongkir: true,
          grandTotal: true,
          statusPembayaran: true,
          customer: { select: { nama: true } },
        },
      });

      // 4. Cek apakah seluruh item di order sudah disepakati (tidak ada yang MENUNGGU_DESAIN / MENUNGGU_NEGOSIASI)
      const unagreedItems = await tx.orderItem.findMany({
        where: {
          orderId,
          deletedAt: null,
          statusHarga: { in: ["MENUNGGU_DESAIN", "MENUNGGU_NEGOSIASI"] },
        },
      });

      if (unagreedItems.length === 0 && grandTotal > 0) {
        // Cek apakah jurnal piutang untuk order ini sudah pernah dibuat
        const piutangKeterangan = `Piutang Order #${updatedOrder.nomorOrder} - ${updatedOrder.customer?.nama || ""}`;
        const existingJurnal = await tx.jurnalUmum.findFirst({
          where: {
            OR: [
              { keterangan: { contains: `Piutang Order #${updatedOrder.nomorOrder}` } },
              { ref: updatedOrder.nomorOrder.slice(0, 10) },
            ],
          },
        });

        if (!existingJurnal) {
          const settings = await tx.appSetting.findUnique({ where: { id: 1 } });
          const piutangAkun = await tx.akun.findUnique({
            where: { kodeAkun: "1-003" },
          });
          const pendapatanAkun = settings?.defaultPendapatanAkunId
            ? await tx.akun.findUnique({
                where: { id: settings.defaultPendapatanAkunId },
              })
            : await tx.akun.findUnique({ where: { kodeAkun: "4-001" } });

          if (piutangAkun && pendapatanAkun) {
            await createJurnalDoubleEntry(
              {
                ref: `${updatedOrder.nomorOrder.slice(0, 10)}`,
                tanggal: new Date(),
                keterangan: piutangKeterangan,
                namaBiaya: `Piutang Order #${updatedOrder.nomorOrder}`,
                akunDebetId: piutangAkun.id,
                akunKreditId: pendapatanAkun.id,
                nominal: grandTotal,
                createdById: session.user.id,
              },
              tx as any,
            );
          }
        }
      }

      return { updatedItem, updatedOrder };
    });

    return NextResponse.json({
      message: "Harga berhasil disepakati dan pesanan diperbarui.",
      item: result.updatedItem,
      order: result.updatedOrder,
    });
  } catch (error) {
    console.error("[HARGA PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
