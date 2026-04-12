import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/inventory/opname — List stok opname with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { keterangan: { contains: search } },
        { addedBy: { name: { contains: search } } },
      ];
    }
    
    if (dateFrom || dateTo) {
      where.tanggal = {};
      if (dateFrom) where.tanggal.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.tanggal.lte = end;
      }
    }

    const [results, count] = await Promise.all([
      prisma.stokOpname.findMany({
        where,
        orderBy: { tanggal: "desc" },
        skip,
        take: limit,
        include: {
          addedBy: { select: { name: true, image: true, role: true } },
          items: {
            select: {
              id: true,
              stokSistem: true,
              stokFisik: true,
              selisih: true,
              bahanBaku: { select: { nama: true, unit: { select: { nama: true } } } },
            },
          },
        },
      }),
      prisma.stokOpname.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[GET STOK OPNAME LIST ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/inventory/opname — Create opname + correct stock atomically
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const body = await request.json();
    const { tanggal, keterangan, items } = body;

    if (!tanggal)
      return NextResponse.json({ error: "Tanggal wajib diisi." }, { status: 400 });
    if (!items || !Array.isArray(items) || items.length === 0)
      return NextResponse.json(
        { error: "Minimal 1 item opname harus ditambahkan." },
        { status: 400 },
      );

    for (const it of items) {
      if (!it.bahanBakuId || it.stokFisik === undefined || it.stokFisik === "")
        return NextResponse.json(
          { error: "Setiap item wajib memiliki bahan baku dan stok fisik." },
          { status: 400 },
        );
      if (Number(it.stokFisik) < 0)
        return NextResponse.json(
          { error: "Stok fisik tidak boleh negatif." },
          { status: 400 },
        );
    }

    // Fetch current stock for each bahan baku
    const bahanBakuIds: string[] = [
      ...new Set(items.map((it: { bahanBakuId: string }) => it.bahanBakuId)),
    ];
    const bahanBakuList = await prisma.bahanBaku.findMany({
      where: { id: { in: bahanBakuIds } },
      select: { id: true, stok: true },
    });
    const stokMap = Object.fromEntries(
      bahanBakuList.map((b) => [b.id, Number(b.stok)]),
    );

    const opnameId = crypto.randomUUID();
    const parsedDate = new Date(tanggal);

    await prisma.$transaction([
      // 1. Create header
      prisma.stokOpname.create({
        data: {
          id: opnameId,
          tanggal: parsedDate,
          keterangan: keterangan || null,
          addedById: session.user.id,
          items: {
            create: items.map((it: { bahanBakuId: string; stokFisik: number }) => {
              const stokSistem = stokMap[it.bahanBakuId] ?? 0;
              const stokFisik = Number(it.stokFisik);
              const selisih = stokFisik - stokSistem;
              return {
                id: crypto.randomUUID(),
                bahanBakuId: it.bahanBakuId,
                stokSistem,
                stokFisik,
                selisih,
              };
            }),
          },
        },
      }),
      // 2. Adjust each bahan baku stock to stokFisik value
      ...items.map((it: { bahanBakuId: string; stokFisik: number }) =>
        prisma.bahanBaku.update({
          where: { id: it.bahanBakuId },
          data: { stok: Number(it.stokFisik) },
        }),
      ),
    ]);

    return NextResponse.json(
      { message: "Stok opname berhasil dicatat dan stok dikoreksi." },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST STOK OPNAME ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
