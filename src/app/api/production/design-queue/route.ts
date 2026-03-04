import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "designer", "produksi", "kasir"];

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401 };
  if (!session.user.role || !ALLOWED_ROLES.includes(session.user.role))
    return { error: "Forbidden.", status: 403 };
  return { error: null, status: 200 };
}

// GET /api/production/design-queue
export async function GET(req: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "18"));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() ?? "";
    const hasFile = searchParams.get("hasFile") ?? "all"; // "all" | "true" | "false"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      statusProduksi: "DESAIN",
    };

    if (search) {
      where.OR = [
        { nomorOrder: { contains: search } },
        { customer: { nama: { contains: search } } },
      ];
    }

    // Filter by file existence
    if (hasFile === "true") {
      where.designFiles = { some: {} };
    } else if (hasFile === "false") {
      where.designFiles = { none: {} };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          nomorOrder: true,
          deadline: true,
          statusProduksi: true,
          catatan: true,
          createdAt: true,
          customer: {
            select: { id: true, nama: true, nomorHp: true },
          },
          items: {
            select: { nama: true, qty: true },
            take: 5,
          },
          designFiles: {
            select: {
              id: true,
              nama: true,
              filePath: true,
              createdAt: true,
              uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ results: orders, count: total, page, limit });
  } catch (err) {
    console.error("[DESIGN QUEUE ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
