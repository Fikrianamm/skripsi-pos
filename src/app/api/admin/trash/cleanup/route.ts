import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/trash/cleanup
 *
 * Permanently removes soft-deleted records that have been in the trash for ≥60 days.
 * Handles cascade relationships that the database doesn't automatically manage.
 *
 * Deletion order matters because of foreign key constraints:
 * 1. First identify which parent records will be deleted
 * 2. Manually delete child records that use SetNull (JurnalUmum, etc.)
 * 3. Delete parent records (cascade handles Cascade-annotated children)
 * 4. Delete independent soft-deleted records last
 */
export async function GET() {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const expiredFilter = { deletedAt: { lt: sixtyDaysAgo } };

    // ── Phase 1: Identify expired parent record IDs ────────────────────────
    const [expiredOrders, expiredPenerimaan, expiredPengeluaran] =
      await Promise.all([
        prisma.order.findMany({
          where: expiredFilter,
          select: { id: true },
        }),
        prisma.penerimaanBarang.findMany({
          where: expiredFilter,
          select: { id: true },
        }),
        prisma.pengeluaranBarang.findMany({
          where: expiredFilter,
          select: { id: true },
        }),
      ]);

    const orderIds = expiredOrders.map((o) => o.id);
    const penerimaanIds = expiredPenerimaan.map((p) => p.id);
    const pengeluaranIds = expiredPengeluaran.map((p) => p.id);

    // ── Phase 2: Delete in correct order within a transaction ──────────────
    const results = await prisma.$transaction([
      // 2a. JurnalUmum referencing expired payments (from expired orders)
      //     Payment→Order is Cascade, but JurnalUmum→Payment is SetNull.
      //     Delete jurnal entries linked to payments of expired orders FIRST.
      ...(orderIds.length > 0
        ? [
            prisma.jurnalUmum.deleteMany({
              where: { payment: { orderId: { in: orderIds } } },
            }),
          ]
        : []),

      // 2b. JurnalUmum referencing expired penerimaan (SetNull relation)
      ...(penerimaanIds.length > 0
        ? [
            prisma.jurnalUmum.deleteMany({
              where: { penerimaanId: { in: penerimaanIds } },
            }),
          ]
        : []),

      // 2c. StokKeluar from expired pengeluaran (Cascade, but be safe)
      ...(pengeluaranIds.length > 0
        ? [
            prisma.stokKeluar.deleteMany({
              where: { pengeluaranId: { in: pengeluaranIds } },
            }),
          ]
        : []),

      // 2d. Delete expired PengeluaranBarang (SPK→PengeluaranBarang is SetNull)
      prisma.pengeluaranBarang.deleteMany({ where: expiredFilter }),

      // 2e. Delete expired PenerimaanBarang (StokMasuk cascade, JurnalUmum already cleaned)
      prisma.penerimaanBarang.deleteMany({ where: expiredFilter }),

      // 2f. Delete expired Orders
      //     Cascade will auto-delete: OrderItem, Payment, SPK, DesignFile, OrderComment
      prisma.order.deleteMany({ where: expiredFilter }),

      // 2g. Delete orphan OrderItems that were individually soft-deleted
      prisma.orderItem.deleteMany({ where: expiredFilter }),

      // 2h. Delete expired SPK (that were independently soft-deleted, not via Order cascade)
      prisma.sPK.deleteMany({ where: expiredFilter }),

      // 2i. Delete expired Products
      prisma.product.deleteMany({ where: expiredFilter }),

      // 2j. Delete expired Customers
      //     Must come after Orders (Customer→Order is Restrict)
      prisma.customer.deleteMany({ where: expiredFilter }),

      // 2k. Delete expired Payments (individually soft-deleted, not via Order)
      prisma.payment.deleteMany({ where: expiredFilter }),

      // 2l. Delete expired JurnalUmum (individually soft-deleted)
      prisma.jurnalUmum.deleteMany({ where: expiredFilter }),
    ]);

    const totalDeleted = results.reduce((acc, curr) => acc + curr.count, 0);

    return NextResponse.json({
      message: "Cleanup successful",
      totalDeleted,
      details: results,
    });
  } catch (error) {
    console.error("[TRASH CLEANUP ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
