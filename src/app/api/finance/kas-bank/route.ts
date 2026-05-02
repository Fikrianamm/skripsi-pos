import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  const allowed = ["admin", "kasir"];
  if (!allowed.includes(session.user.role!))
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allowed = ["admin", "kasir"];
    if (!allowed.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jenisFilter = searchParams.get("jenisRekening");

    const kasBanks = await prisma.kasBank.findMany({
      where: jenisFilter ? { jenisRekening: jenisFilter } : {},
      orderBy: { jenisRekening: "asc" },
      include: {
        akun: true
      }
    });

    const kasBanksWithBalance = await Promise.all(
      kasBanks.map(async (kb) => {
        if (!kb.akunId) {
          return { ...kb, saldoSaatIni: 0 };
        }

        const debet = await prisma.jurnalUmum.aggregate({
          where: { akunDebetId: kb.akunId },
          _sum: { nominal: true }
        });

        const kredit = await prisma.jurnalUmum.aggregate({
          where: { akunKreditId: kb.akunId },
          _sum: { nominal: true }
        });

        const totalDebet = Number(debet._sum.nominal || 0);
        const totalKredit = Number(kredit._sum.nominal || 0);
        
        // Asumsi posisi normal AKTIVA_LANCAR adalah DEBET
        const saldoSaatIni = totalDebet - totalKredit;

        return {
          id: kb.id,
          namaRekening: kb.namaRekening,
          jenisRekening: kb.jenisRekening,
          nomorRekening: kb.nomorRekening,
          akunId: kb.akunId,
          akun: kb.akun,
          isActive: kb.isActive,
          saldoSaatIni
        };
      })
    );

    return NextResponse.json({ kasBanks: kasBanksWithBalance });
  } catch (error) {
    console.error("[KAS_BANK_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { id, namaRekening, jenisRekening, nomorRekening, isActive } = body;

    if (!id) {
        return NextResponse.json({ error: "ID wajib disertakan." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (namaRekening !== undefined) updateData.namaRekening = namaRekening;
    if (jenisRekening !== undefined) updateData.jenisRekening = jenisRekening;
    if (nomorRekening !== undefined) updateData.nomorRekening = nomorRekening;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.kasBank.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Rekening berhasil diupdate.", kasBank: updated }, { status: 200 });
  } catch (err) {
    console.error("[PATCH_KASBANK_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
