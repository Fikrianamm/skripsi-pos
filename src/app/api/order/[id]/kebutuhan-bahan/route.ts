/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotificationForRole, JenisNotif } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

async function requireDesignerOrAdminAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      error: "Unauthorized. Silakan login terlebih dahulu.",
      status: 401,
      session: null,
    };
  }
  const ALLOWED = ["admin", "designer"];
  if (!session.user.role || !ALLOWED.includes(session.user.role)) {
    return {
      error: "Forbidden. Hanya desainer atau admin yang dapat menentukan bahan custom.",
      status: 403,
      session: null,
    };
  }
  return { error: null, status: 200, session };
}

// POST /api/order/[id]/kebutuhan-bahan — Desainer mengunci bahan custom & kirim ke kasir
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireDesignerOrAdminAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const body = await req.json();
    const { orderItemId, bahan } = body;

    if (!orderItemId) {
      return NextResponse.json(
        { error: "orderItemId wajib diisi." },
        { status: 400 },
      );
    }

    if (!bahan || !Array.isArray(bahan) || bahan.length === 0) {
      return NextResponse.json(
        { error: "Daftar bahan baku wajib diisi minimal satu bahan." },
        { status: 400 },
      );
    }

    // Verifikasi order dan orderItem
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: orderItemId, orderId, deletedAt: null },
      include: {
        order: { select: { id: true, nomorOrder: true, statusProduksi: true } },
        product: { select: { id: true, nama: true, isService: true } },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Item pesanan tidak ditemukan pada order ini." },
        { status: 404 },
      );
    }

    // Validasi semua bahan baku ada di database
    const bahanBakuIds = bahan.map((b: any) => b.bahanBakuId);
    const existingBahan = await prisma.bahanBaku.findMany({
      where: { id: { in: bahanBakuIds }, isActive: true },
      select: { id: true, nama: true, unit: { select: { nama: true } } },
    });

    if (existingBahan.length !== bahanBakuIds.length) {
      return NextResponse.json(
        { error: "Satu atau lebih bahan baku tidak valid atau tidak aktif." },
        { status: 400 },
      );
    }

    const bahanMap = new Map(existingBahan.map((b) => [b.id, b]));

    // Simpan ke kebutuhan_bahan_custom & update statusHarga ke MENUNGGU_NEGOSIASI
    await prisma.$transaction(async (tx) => {
      // Hapus kebutuhan bahan custom lama jika ada (overwrite)
      await tx.kebutuhanBahanCustom.deleteMany({
        where: { orderItemId },
      });

      // Insert data bahan baru
      await tx.kebutuhanBahanCustom.createMany({
        data: bahan.map((b: { bahanBakuId: string; jumlahDibutuhkan: number | string; satuan?: string }) => {
          const bb = bahanMap.get(b.bahanBakuId);
          const satuan = b.satuan || bb?.unit?.nama || "Pcs";
          return {
            id: crypto.randomUUID(),
            orderItemId,
            bahanBakuId: b.bahanBakuId,
            jumlahDibutuhkan: Number(b.jumlahDibutuhkan),
            satuan,
            dicatatOlehId: session.user.id,
          };
        }),
      });

      // Update statusHarga order_item
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          statusHarga: "MENUNGGU_NEGOSIASI",
        },
      });
    });

    // Kirim notifikasi ke role kasir & admin
    try {
      await createNotificationForRole(["kasir", "admin"], {
        title: "Bahan Custom Dikunci",
        message: `Desainer telah menentukan bahan custom untuk pesanan ${orderItem.order.nomorOrder} (${orderItem.nama}). Silakan lakukan kesepakatan harga dengan customer.`,
        jenis: JenisNotif.STATUS_ORDER_UBAH,
        linkUrl: `/order/${orderId}`,
      });
    } catch (notifErr) {
      console.error("[NOTIF ERROR]", notifErr);
    }

    // Ambil data terbaru
    const updatedOrderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        kebutuhanBahanCustom: {
          include: {
            bahanBaku: {
              select: { id: true, nama: true, stok: true, unit: { select: { nama: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Bahan baku custom berhasil dikunci dan dikirim ke kasir.",
      item: updatedOrderItem,
    });
  } catch (error) {
    console.error("[KEBUTUHAN BAHAN POST ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
