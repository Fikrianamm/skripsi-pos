import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };
  if (session.user.role !== "admin") return { error: "Forbidden", status: 403 };
  return { error: null, status: 200 };
}

export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const statusFilter = ["BELUM_BAYAR", "DP"] as Array<"BELUM_BAYAR" | "DP">;

    const where = {
      statusPembayaran: { in: statusFilter },
      ...(search
        ? {
            OR: [
              { nomorOrder: { contains: search } },
              { customer: { nama: { contains: search } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nomorOrder: true,
          grandTotal: true,
          statusPembayaran: true,
          deadline: true,
          createdAt: true,
          customer: {
            select: { id: true, nama: true, nomorHp: true, image: true },
          },
          payments: { select: { nominal: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const results = orders.map((o) => {
      const sudahDibayar = o.payments.reduce((s, p) => s + Number(p.nominal), 0);
      const sisaTagihan = Math.max(0, Number(o.grandTotal) - sudahDibayar);
      return {
        id: o.id,
        nomorOrder: o.nomorOrder,
        grandTotal: Number(o.grandTotal),
        sudahDibayar,
        sisaTagihan,
        statusPembayaran: o.statusPembayaran,
        deadline: o.deadline,
        createdAt: o.createdAt,
        customer: o.customer,
      };
    });

    return NextResponse.json({
      results,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (err) {
    console.error("[PIUTANG ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
