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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }

    const [payments, costs] = await Promise.all([
      prisma.payment.findMany({
        where: Object.keys(dateFilter).length ? { tanggal: dateFilter } : undefined,
        select: {
          id: true,
          nominal: true,
          metodePembayaran: true,
          keterangan: true,
          tanggal: true,
          order: { select: { nomorOrder: true } },
          user: { select: { name: true } },
        },
        orderBy: { tanggal: "desc" },
      }),
      prisma.cost.findMany({
        where: Object.keys(dateFilter).length ? { tanggal: dateFilter } : undefined,
        select: {
          id: true,
          nominal: true,
          nama: true,
          keterangan: true,
          tanggal: true,
          costCategory: { select: { nama: true } },
        },
        orderBy: { tanggal: "desc" },
      }),
    ]);

    type JournalEntry = {
      id: string;
      tanggal: Date;
      keterangan: string;
      tipe: "MASUK" | "KELUAR";
      akun: string;
      nominal: number;
    };

    const entries: JournalEntry[] = [
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        tanggal: p.tanggal,
        keterangan: `Pembayaran Order #${p.order.nomorOrder}${p.keterangan ? ` - ${p.keterangan}` : ""}`,
        tipe: "MASUK" as const,
        akun: p.metodePembayaran,
        nominal: Number(p.nominal),
      })),
      ...costs.map((c) => ({
        id: `cost-${c.id}`,
        tanggal: c.tanggal,
        keterangan: `${c.costCategory.nama} - ${c.nama}`,
        tipe: "KELUAR" as const,
        akun: c.costCategory.nama,
        nominal: Number(c.nominal),
      })),
    ];

    // Sort by tanggal descending
    entries.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    const total = entries.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedEntries = entries.slice(skip, skip + limit);

    const totalMasuk = entries
      .filter((e) => e.tipe === "MASUK")
      .reduce((s, e) => s + e.nominal, 0);
    const totalKeluar = entries
      .filter((e) => e.tipe === "KELUAR")
      .reduce((s, e) => s + e.nominal, 0);

    return NextResponse.json({
      results: paginatedEntries,
      pagination: { total, totalPages, page, limit },
      summary: { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar },
    });
  } catch (err) {
    console.error("[ARUS KAS ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
