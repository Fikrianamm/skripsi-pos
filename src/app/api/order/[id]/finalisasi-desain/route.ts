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
      error: "Forbidden. Hanya desainer atau admin yang dapat melakukan aksi ini.",
      status: 403,
      session: null,
    };
  }
  return { error: null, status: 200, session };
}

// POST /api/order/[id]/finalisasi-desain
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireDesignerOrAdminAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const body = await req.json();
    const { isDesignFinal, materials } = body;

    // materials is expected to be:
    // [
    //   { orderItemId: string, bahan: [{ bahanBakuId, jumlahDibutuhkan, satuan }] }
    // ]

    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        items: {
          include: { product: { select: { isService: true } } }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (order.designerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Hanya desainer yang mengambil antrean ini yang dapat menyelesaikannya." }, { status: 403 });
    }

    // Validate materials length
    if (materials && Array.isArray(materials)) {
      for (const m of materials) {
        if (!m.bahan || !Array.isArray(m.bahan) || m.bahan.length === 0) {
          return NextResponse.json({ error: "Setiap item custom wajib memiliki minimal 1 bahan baku." }, { status: 400 });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (materials && Array.isArray(materials)) {
        for (const m of materials) {
          const { orderItemId, bahan } = m;
          
          // Verify orderItem belongs to this order
          const itemExists = order.items.find(i => i.id === orderItemId);
          if (!itemExists) continue;

          // Validate bahan exist
          const bahanBakuIds = bahan.map((b: any) => b.bahanBakuId);
          const existingBahan = await tx.bahanBaku.findMany({
            where: { id: { in: bahanBakuIds }, isActive: true },
            select: { id: true, nama: true, unit: { select: { nama: true } } },
          });

          if (existingBahan.length !== bahanBakuIds.length) {
            throw new Error("Satu atau lebih bahan baku tidak valid atau tidak aktif.");
          }

          const bahanMap = new Map(existingBahan.map((b) => [b.id, b]));

          // Clear old ones
          await tx.kebutuhanBahanCustom.deleteMany({
            where: { orderItemId },
          });

          // Insert new
          await tx.kebutuhanBahanCustom.createMany({
            data: bahan.map((b: any) => {
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

          // Update item statusHarga
          await tx.orderItem.update({
            where: { id: orderItemId },
            data: { statusHarga: "MENUNGGU_NEGOSIASI" },
          });
        }
      }

      // Update Order isDesignFinal
      if (isDesignFinal !== undefined) {
        await tx.order.update({
          where: { id: orderId },
          data: { 
            isDesignFinal,
            designReviewStatus: isDesignFinal ? "ACC" : order.designReviewStatus
          },
        });
      }
    });

    return NextResponse.json({ message: "Berhasil menyimpan kebutuhan bahan baku." });
  } catch (error: any) {
    console.error("[FINALISASI DESAIN ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
