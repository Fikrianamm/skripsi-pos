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

// GET /api/production/design-archive — semua DesignFile lintas order dan tahap
export async function GET(req: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "24"));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() ?? "";
    const tahap = searchParams.get("tahap") ?? "all";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (tahap !== "all") {
      where.order = { statusProduksi: tahap };
    }

    // Filter by upload date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to make dateTo inclusive
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { order: { nomorOrder: { contains: search } } },
        { order: { customer: { nama: { contains: search } } } },
        { uploadedBy: { name: { contains: search } } },
      ];
    }

    const [files, total] = await Promise.all([
      prisma.designFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nama: true,
          filePath: true,
          createdAt: true,
          uploadedBy: { select: { id: true, name: true } },
          order: {
            select: {
              id: true,
              nomorOrder: true,
              statusProduksi: true,
              deadline: true,
              customer: { select: { id: true, nama: true, nomorHp: true } },
            },
          },
        },
      }),
      prisma.designFile.count({ where }),
    ]);

    return NextResponse.json({ results: files, count: total, page, limit });
  } catch (err) {
    console.error("[BANK DESAIN ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
