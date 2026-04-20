import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/customer/[id]/orders — list orders for a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (
      session.user.role !== "admin" &&
      session.user.role !== "kasir"
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan." },
        { status: 404 },
      );
    }

    const orders = await prisma.order.findMany({
      where: { customerId: id },
      select: {
        id: true,
        nomorOrder: true,
        grandTotal: true,
        statusPembayaran: true,
        statusProduksi: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const firstOrder = orders.length > 0 ? orders[orders.length - 1] : null;
    const totalOrder = orders.length;
    const totalSpend = orders.reduce(
      (sum, o) => sum + Number(o.grandTotal),
      0,
    );

    return NextResponse.json({
      results: orders,
      firstOrder,
      totalOrder,
      totalSpend,
    });
  } catch (error) {
    console.error("[CUSTOMER ORDERS ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
