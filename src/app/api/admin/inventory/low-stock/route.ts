import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bahanBaku = await prisma.bahanBaku.findMany({
      where: {
        isActive: true,
        minStok: { not: null },
      },
      select: {
        id: true,
        nama: true,
        stok: true,
        minStok: true,
        unit: { select: { nama: true } },
      },
    });

    const lowStockItems = bahanBaku.filter(
      (item) => Number(item.stok) <= Number(item.minStok)
    );

    return NextResponse.json(lowStockItems);
  } catch (error) {
    console.error("[LOW STOCK API ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
