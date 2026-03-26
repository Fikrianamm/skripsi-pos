import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401, session: null };
  const allowed = ["admin", "produksi", "kasir"];
  if (!session.user.role || !allowed.includes(session.user.role))
    return { error: "Forbidden.", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/production/spk — daftar SPK dengan filter & pagination
export async function GET(req: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const fetchAll = searchParams.get("all") === "true";
    const limit = fetchAll
      ? undefined
      : Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = fetchAll ? undefined : (page - 1) * (limit ?? 20);
    const search = searchParams.get("search")?.trim() ?? "";
    const statusSPK = searchParams.get("statusSPK") ?? "all";
    const karyawanId = searchParams.get("karyawanId") ?? "";
    const accCetak = searchParams.get("accCetak") ?? "all";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = fetchAll
      ? {} // when fetching all for select dropdowns, no stage filter
      : { tahapProduksi: "JAHIT" }; // production queue only shows JAHIT

    if (!fetchAll) {
      if (statusSPK !== "all") where.statusSPK = statusSPK;
      if (karyawanId) where.karyawanId = karyawanId;
      if (accCetak === "true") where.accCetak = true;
      if (accCetak === "false") where.accCetak = false;
    }

    if (search) {
      where.OR = [
        { order: { nomorOrder: { contains: search } } },
        { order: { customer: { nama: { contains: search } } } },
        { karyawan: { nama: { contains: search } } },
        { model: { contains: search } },
      ];
    }

    const [spkList, total] = await Promise.all([
      prisma.sPK.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { tanggalSetor: "asc" }, // yang paling dekat deadline duluan
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          orderId: true,
          tahapProduksi: true,
          model: true,
          ukuran: true,
          tali: true,
          jumlah: true,
          catatan: true,
          tanggalSetor: true,
          accCetak: true,
          accCetakAt: true,
          accCetakOleh: true,
          statusSPK: true,
          createdAt: true,
          karyawan: { select: { id: true, nama: true, posisi: true } },
          order: {
            select: {
              id: true,
              nomorOrder: true,
              deadline: true,
              statusProduksi: true,
              customer: { select: { id: true, nama: true, nomorHp: true } },
              items: {
                select: { nama: true, qty: true },
                take: 3,
              },
            },
          },
        },
      }),
      prisma.sPK.count({ where }),
    ]);

    return NextResponse.json({ results: spkList, count: total, page, limit });
  } catch (err) {
    console.error("[SPK QUEUE ERROR]", err);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
