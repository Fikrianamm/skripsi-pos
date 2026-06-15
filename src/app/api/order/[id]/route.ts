/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  notifyOrderStatusChange,
  createNotificationForRole,
  createNotification,
} from "@/lib/notifications";
import { JenisNotif } from "../../../../../generated/prisma/enums";

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
  deletedAt: true,
  designerId: true,
  isDesignFinal: true,
  designReviewStatus: true,
  designer: { select: { id: true, name: true, image: true } },
  customer: { select: { id: true, nama: true, nomorHp: true, image: true } },
  items: {
    select: {
      id: true,
      productId: true,
      nama: true,
      harga: true,
      qty: true,
      subtotal: true,
      product: { select: { id: true, sku: true, nama: true } },
    },
    where: { deletedAt: null },
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
  payments: {
    select: {
      id: true,
      nominal: true,
      metodePembayaran: true,
      tanggal: true,
      user: { select: { name: true } },
    },
    where: { deletedAt: null },
    orderBy: { tanggal: "asc" as const },
  },
} as any;

async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return {
      error: "Unauthorized.",
      status: 401,
      session: null,
      isAdmin: false,
    };
  const ALLOWED = ["admin", "kasir", "designer", "produksi", "gudang"];
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

    if (!order || order.deletedAt) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan atau sudah dihapus." },
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
    const { error, status, isAdmin, session } = await requireOrderAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        nomorOrder: true,
        statusProduksi: true,
        designerId: true,
        isDesignFinal: true,
        items: {
          select: {
            productId: true,
            qty: true,
            product: { select: { isService: true } },
          },
        },
      },
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
      designerId,
      isDesignFinal,
      designReviewStatus,
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

    const VALID_STATUS_BAYAR = ["BELUM_BAYAR", "DP", "LUNAS"];
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

    // Handle designerId assignment
    if (designerId !== undefined) {
      const userRole = session?.user?.role;
      if (userRole !== "admin" && userRole !== "designer") {
        return NextResponse.json(
          { error: "Hanya desainer atau admin yang dapat mengklaim antrean." },
          { status: 403 },
        );
      }
      if (userRole === "designer") {
        if (designerId !== session?.user?.id) {
          return NextResponse.json(
            {
              error:
                "Desainer hanya dapat mengklaim antrean untuk diri sendiri.",
            },
            { status: 400 },
          );
        }
        if (existing.designerId && existing.designerId !== session?.user?.id) {
          return NextResponse.json(
            { error: "Antrean sudah diambil oleh desainer lain." },
            { status: 400 },
          );
        }
      }
      data.designerId = designerId;
    }

    // Handle isDesignFinal (hanya admin/kasir)
    if (isDesignFinal !== undefined) {
      const userRole = session?.user?.role;
      if (userRole !== "admin" && userRole !== "kasir") {
        return NextResponse.json(
          { error: "Hanya admin atau kasir yang dapat memfinalisasi desain." },
          { status: 403 },
        );
      }
      data.isDesignFinal = isDesignFinal;

      // Sinkronkan designReviewStatus dengan isDesignFinal
      if (isDesignFinal === true) {
        data.designReviewStatus = "ACC";
      }

      // Jika di-reset (false), reset juga designReviewStatus
      if (isDesignFinal === false) {
        data.designReviewStatus = null;
      }

      // Notifikasi saat desain di-ACC
      if (isDesignFinal === true && !existing.isDesignFinal) {
        try {
          await createNotificationForRole(["produksi"], {
            title: "Desain ACC — Siap Produksi",
            message: `Desain untuk Order #${existing.nomorOrder} telah di-ACC. Silakan buat SPK.`,
            jenis: JenisNotif.SISTEM,
            linkUrl: `/production/design-queue`,
          });
        } catch (e) {
          console.error("Failed to notify final design:", e);
        }
      }
    }

    // Handle designReviewStatus
    if (designReviewStatus !== undefined) {
      const userRole = session?.user?.role;
      const VALID_REVIEW = ["PENDING_REVIEW", "REVISI", "ACC"];
      if (!VALID_REVIEW.includes(designReviewStatus)) {
        return NextResponse.json(
          { error: "Status review tidak valid." },
          { status: 400 },
        );
      }

      // Desainer yang claim atau admin bisa request review (PENDING_REVIEW)
      if (designReviewStatus === "PENDING_REVIEW") {
        const isAdminUser = userRole === "admin";
        const isDesignerWhoClaimed =
          userRole === "designer" && existing.designerId === session?.user?.id;
        if (!isAdminUser && !isDesignerWhoClaimed) {
          return NextResponse.json(
            {
              error:
                "Hanya desainer yang mengambil tugas ini atau admin yang bisa request review.",
            },
            { status: 403 },
          );
        }
        data.designReviewStatus = "PENDING_REVIEW";
        // Notif ke admin dan kasir
        try {
          await createNotificationForRole(["admin", "kasir"], {
            title: "Permintaan Review Desain",
            message: `Desainer meminta review untuk Order #${existing.nomorOrder}. Silakan ACC atau Revisi.`,
            jenis: JenisNotif.SISTEM,
            linkUrl: `/production/design-queue`,
          });
        } catch (e) {
          console.error("Failed to notify review request:", e);
        }
      }

      // Admin/kasir bisa ACC atau Revisi
      if (designReviewStatus === "ACC" || designReviewStatus === "REVISI") {
        if (userRole !== "admin" && userRole !== "kasir") {
          return NextResponse.json(
            {
              error: "Hanya admin atau kasir yang bisa ACC atau Revisi desain.",
            },
            { status: 403 },
          );
        }
        data.designReviewStatus = designReviewStatus;

        // Jika ACC → set isDesignFinal true
        if (designReviewStatus === "ACC") {
          data.isDesignFinal = true;
        }

        // Notif ke desainer yang claim (dengan Pusher real-time)
        if (existing.designerId) {
          try {
            await createNotification({
              userId: existing.designerId,
              title:
                designReviewStatus === "ACC"
                  ? "✅ Desain Disetujui!"
                  : "🔄 Desain Perlu Revisi",
              message:
                designReviewStatus === "ACC"
                  ? `Desain untuk Order #${existing.nomorOrder} telah di-ACC. Terima kasih!`
                  : `Desain untuk Order #${existing.nomorOrder} perlu direvisi. Periksa komentar untuk detailnya.`,
              jenis: JenisNotif.SISTEM,
              linkUrl: `/production/design-queue`,
            });
            // Jika ACC juga notif ke produksi
            if (designReviewStatus === "ACC") {
              await createNotificationForRole(["produksi"], {
                title: "Desain ACC — Siap Produksi",
                message: `Desain untuk Order #${existing.nomorOrder} telah di-ACC. Silakan buat SPK.`,
                jenis: JenisNotif.SISTEM,
                linkUrl: `/production/design-queue`,
              });
            }
          } catch (e) {
            console.error("Failed to notify designer review decision:", e);
          }
        }
      }
    }

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

    const updated = await prisma.order.update({
      where: { id },
      data,
      select: ORDER_DETAIL_SELECT,
    });

    // ─── Fitur #3: Kurangi Stok Produk Jadi saat Pesanan SELESAI ───
    if (statusProduksi === "SELESAI" && existing.statusProduksi !== "SELESAI") {
      const produkItems = existing.items.filter(
        (item) => item.product && !item.product.isService,
      );

      if (produkItems.length > 0) {
        await prisma.$transaction(
          produkItems.map((item) =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stok: { decrement: Number(item.qty) } },
            }),
          ),
        );
      }
    }

    // Notify roles about status change if statusProduksi was updated
    if (
      statusProduksi !== undefined &&
      statusProduksi !== existing.statusProduksi
    ) {
      await notifyOrderStatusChange(
        id,
        String(updated.nomorOrder),
        statusProduksi,
      );
    }

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
            }) => ({
              id: crypto.randomUUID(),
              orderId: id,
              productId: item.productId,
              nama: item.nama,
              harga: item.harga,
              qty: item.qty,
              subtotal: item.subtotal,
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
      select: { 
        id: true, 
        nomorOrder: true, 
        statusProduksi: true,
        items: {
          select: {
            productId: true,
            qty: true,
            product: { select: { isService: true } }
          }
        }
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    // OrderItem, Payment, SPK, dan JurnalUmum terkait akan di-soft delete
    const now = new Date();
    
    const transactions: any[] = [
      prisma.order.update({
        where: { id },
        data: { deletedAt: now },
      }),
      prisma.orderItem.updateMany({
        where: { orderId: id },
        data: { deletedAt: now },
      }),
      prisma.payment.updateMany({
        where: { orderId: id },
        data: { deletedAt: now },
      }),
      prisma.sPK.updateMany({
        where: { orderId: id },
        data: { deletedAt: now },
      }),
      prisma.jurnalUmum.updateMany({
        where: { payment: { orderId: id } },
        data: { deletedAt: now },
      }),
    ];

    // Jika pesanan sudah SELESAI, stok produk sudah dikurangi. Kita perlu mengembalikannya.
    if (existing.statusProduksi === "SELESAI") {
      const produkItems = existing.items.filter(
        (item) => item.product && !item.product.isService,
      );
      
      for (const item of produkItems) {
        transactions.push(
          prisma.product.update({
            where: { id: item.productId },
            data: { stok: { increment: Number(item.qty) } }
          })
        );
      }
    }

    await prisma.$transaction(transactions);

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
