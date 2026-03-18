import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo } from "@/lib/storage";
import path from "path";

// GET /api/admin/bahan-baku/[id]/stok-masuk — List stok masuk for a bahan baku
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [resultsRaw, count] = await Promise.all([
      prisma.stokMasuk.findMany({
        where: { bahanBakuId: id },
        orderBy: { penerimaan: { tanggal: "desc" } },
        skip,
        take: limit,
        include: {
          penerimaan: {
            include: {
              supplier: { select: { id: true, nama: true } },
              addedBy: { select: { name: true } },
            },
          },
        },
      }),
      prisma.stokMasuk.count({ where: { bahanBakuId: id } }),
    ]);

    const results = resultsRaw.map((r) => ({
      id: r.id,
      jumlah: r.jumlah,
      hargaBeli: r.hargaBeli,
      tanggal: r.penerimaan.tanggal,
      nomorFaktur: r.penerimaan.nomorFaktur,
      buktiNota: r.penerimaan.buktiNota,
      keterangan: r.penerimaan.keterangan,
      supplier: r.penerimaan.supplier,
      addedBy: r.penerimaan.addedBy,
    }));

    return NextResponse.json({ results, count, page, limit });
  } catch (error) {
    console.error("[GET STOK MASUK ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}

// POST /api/admin/bahan-baku/[id]/stok-masuk — Add stok masuk & update stok
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { id } = await params;
    const formData = await request.formData();

    // Parse form data fields
    const jumlah = formData.get("jumlah") as string;
    const supplierId = formData.get("supplierId") as string | null;
    const hargaBeli = formData.get("hargaBeli") as string | null;
    const nomorFaktur = formData.get("nomorFaktur") as string | null;
    const tanggal = formData.get("tanggal") as string | null;
    const keterangan = formData.get("keterangan") as string | null;
    const buktiNotaFile = formData.get("buktiNota") as File | null;

    if (!jumlah || Number(jumlah) <= 0) {
      return NextResponse.json(
        { error: "Jumlah harus lebih dari 0.", field: "jumlah" },
        { status: 400 },
      );
    }

    const bahanBaku = await prisma.bahanBaku.findUnique({ where: { id } });
    if (!bahanBaku) {
      return NextResponse.json(
        { error: "Bahan baku tidak ditemukan." },
        { status: 404 },
      );
    }

    // Handle file upload if present
    let fileUrl: string | null = null;
    if (buktiNotaFile && buktiNotaFile.size > 0) {
      const ext = path.extname(buktiNotaFile.name) || "";
      const fileId = crypto.randomUUID();
      const s3Key = `stok-masuk/${id}/${fileId}${ext}`;
      const buffer = Buffer.from(await buktiNotaFile.arrayBuffer());

      fileUrl = await uploadToNeo({
        key: s3Key,
        body: buffer,
        contentType: buktiNotaFile.type,
      });
    }

    const penerimaanId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const hargaBeliNum = hargaBeli ? Number(hargaBeli) : null;
    const q = Number(jumlah);
    const totalHargaItem = hargaBeliNum ? q * hargaBeliNum : null;

    // Transactional: create penerimaan header + item detail + update stok bahan baku
    const [penerimaanBarang] = await prisma.$transaction([
      prisma.penerimaanBarang.create({
        data: {
          id: penerimaanId,
          nomorFaktur: nomorFaktur || null,
          supplierId: supplierId || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          keterangan: keterangan || null,
          buktiNota: fileUrl,
          totalTagihan: totalHargaItem || 0,
          addedById: session.user.id,
          items: {
            create: {
              id: itemId,
              bahanBakuId: id,
              jumlah: q,
              hargaBeli: hargaBeliNum,
              totalHargaItem: totalHargaItem,
            },
          },
        },
      }),
      prisma.bahanBaku.update({
        where: { id },
        data: { stok: { increment: q } },
      }),
    ]);

    return NextResponse.json(
      { message: "Stok masuk berhasil dicatat.", penerimaanBarang },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST STOK MASUK ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
