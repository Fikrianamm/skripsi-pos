import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // List of models that use soft delete (have deletedAt field)
    // We will hard delete records where deletedAt is older than 60 days.
    
    const results = await prisma.$transaction([
      // 1. Order & its related items (OrderItems, Payments, SPK are cascade deleted if configured, but let's be safe)
      prisma.order.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      prisma.orderItem.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      
      // 2. Products
      prisma.product.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      
      // 3. Customers
      prisma.customer.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      
      // 4. Finance (Cost, Payment, Jurnal)
      prisma.cost.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      prisma.payment.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      prisma.jurnalUmum.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      
      // 5. Inventory Transactions
      prisma.penerimaanBarang.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      prisma.pengeluaranBarang.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
      prisma.sPK.deleteMany({ where: { deletedAt: { lt: sixtyDaysAgo } } }),
    ]);

    const totalDeleted = results.reduce((acc, curr) => acc + curr.count, 0);

    return NextResponse.json({ 
      message: "Cleanup successful", 
      totalDeleted,
      details: results 
    });
  } catch (error) {
    console.error("[TRASH CLEANUP ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
