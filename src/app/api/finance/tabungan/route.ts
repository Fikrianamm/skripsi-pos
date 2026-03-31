/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/tabungan
export async function GET(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");

    const tabungans = await prisma.tabungan.findMany({
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      take: limit,
      include: {
        jenisTabungan: { select: { nama: true } },
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ tabungans });
  } catch (err) {
    console.error("[GET_TABUNGAN_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/tabungan
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { jenisTabunganId, nominal, bulan, tahun, keterangan, kasBankId } = body;

    if (!jenisTabunganId || !kasBankId || typeof nominal !== "number" || nominal <= 0 || !bulan || !tahun) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap atau nominal tidak valid." }, { status: 400 });
    }

    // 1. Validasi tabungan bulan/tahun yang sama
    const exists = await prisma.tabungan.findUnique({
      where: {
        jenisTabunganId_bulan_tahun: {
          jenisTabunganId,
          bulan,
          tahun,
        },
      },
    });

    if (exists) {
        return NextResponse.json({ error: "Alokasi tabungan untuk bulan dan tahun ini sudah tercatat." }, { status: 400 });
    }

    // 2. Transaksi atomik
    const newTabungan = await prisma.$transaction(async (tx) => {
      // a. Ambil data JenisTabungan & KasBank untuk jurnal
      const [jenisTabungan, kasBank] = await Promise.all([
        tx.jenisTabungan.findUnique({ where: { id: jenisTabunganId }, select: { akunId: true, nama: true } }),
        tx.kasBank.findUnique({ where: { id: kasBankId }, select: { akunId: true, saldoSaatIni: true, namaRekening: true } }),
      ]);

      if (!jenisTabungan || !jenisTabungan.akunId) {
        throw new Error("Kategori Tabungan tidak memiliki akun buku besar yang valid.");
      }
      if (!kasBank || !kasBank.akunId) {
        throw new Error("Kas/Bank yang dipilih tidak memiliki akun buku besar yang valid.");
      }

      // Pastikan saldo Kas cukup
      if (Number(kasBank.saldoSaatIni) < nominal) {
        throw new Error(`Saldo ${kasBank.namaRekening} tidak mencukupi untuk disisihkan/dialokasikan.`);
      }

      // b. Buat identitas tabungan record
      const tabunganId = `TBG-${Date.now().toString().slice(-6)}`;
      
      const record = await tx.tabungan.create({
        data: {
          id: tabunganId,
          jenisTabunganId,
          userId: session.user.id,
          nominal,
          bulan,
          tahun,
          keterangan,
        },
      });

      // c. Kurangi saldo KasBank
      await tx.kasBank.update({
        where: { id: kasBankId },
        data: {
          saldoSaatIni: { decrement: nominal },
        },
      });

      // d. Jurnal Umum Double Entry (Debet = Akun Tabungan(Aset), Kredit = KasBank)
      await createJurnalDoubleEntry({
        ref: record.id,
        tanggal: new Date(),
        keterangan: `Siswa/Alokasi Tabungan (${jenisTabungan.nama}) - Periode: ${bulan}/${tahun}: ${keterangan || ""}`,
        akunDebetId: jenisTabungan.akunId, // Aset tabungan bertambah
        akunKreditId: kasBank.akunId, // Kas berkurang
        nominal: Number(nominal),
        sumber: "MANUAL" as any, // Tidak ada SumberJurnal SAVING, kita gunakan manual/default
        tabunganId: record.id,
        createdById: session.user.id,
      }, tx as any);

      return record;
    });

    return NextResponse.json({ message: "Tabungan berhasil dialokasikan.", tabungan: newTabungan }, { status: 201 });
  } catch (err: any) {
    console.error("[POST_TABUNGAN_ERROR]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
