/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "order"; // order, product, customer, cost, jurnal

  try {
    let results: any[] = [];

    if (type === "order") {
      results = await prisma.order.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        include: { customer: { select: { nama: true } } },
      });
    } else if (type === "product") {
      results = await prisma.product.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
      });
    } else if (type === "customer") {
      results = await prisma.customer.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
      });
    } else if (type === "cost") {
      results = await prisma.cost.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
      });
    } else if (type === "jurnal") {
      results = await prisma.jurnalUmum.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        include: {
          akunDebet: { select: { namaAkun: true } },
          akunKredit: { select: { namaAkun: true } },
        },
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[TRASH GET ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { type, id, action } = await request.json(); // action: restore | permanent_delete

    if (action === "restore") {
      if (type === "order") {
        await prisma.$transaction([
          prisma.order.update({ where: { id }, data: { deletedAt: null } }),
          prisma.orderItem.updateMany({ where: { orderId: id }, data: { deletedAt: null } }),
          prisma.payment.updateMany({ where: { orderId: id }, data: { deletedAt: null } }),
          prisma.sPK.updateMany({ where: { orderId: id }, data: { deletedAt: null } }),
          prisma.jurnalUmum.updateMany({ where: { payment: { orderId: id } }, data: { deletedAt: null } }),
        ]);
      } else if (type === "product") {
        await prisma.product.update({ where: { id }, data: { deletedAt: null } });
      } else if (type === "customer") {
        await prisma.customer.update({ where: { id }, data: { deletedAt: null } });
      } else if (type === "cost") {
        await prisma.cost.update({ where: { id }, data: { deletedAt: null } });
      } else if (type === "jurnal") {
        await prisma.jurnalUmum.update({ where: { id }, data: { deletedAt: null } });
      }
      return NextResponse.json({ message: "Data berhasil dipulihkan." });
    } 
    
    if (action === "permanent_delete") {
       // Optional: implement physical delete if needed. 
       // For now, we'll just keep it in trash or do nothing.
       return NextResponse.json({ message: "Fitur hapus permanen belum diaktifkan demi keamanan data." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[TRASH POST ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
