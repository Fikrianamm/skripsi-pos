import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.appSetting.findUnique({
      where: { id: 1 },
      include: {
        akunPendapatan: true,
      },
    });

    // Fetch KasBank for invoice rekening
    let invoiceRekenings: { id: string; namaRekening: string; jenisRekening: string; nomorRekening: string | null }[] = [];
    if (settings?.invoiceRekeningIds) {
      try {
        const ids: string[] = JSON.parse(settings.invoiceRekeningIds);
        if (ids.length > 0) {
          invoiceRekenings = await prisma.kasBank.findMany({
            where: { id: { in: ids }, isActive: true, jenisRekening: "BANK" },
            select: { id: true, namaRekening: true, jenisRekening: true, nomorRekening: true },
          });
        }
      } catch {}
    }

    return NextResponse.json({ ...settings, invoiceRekenings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      namaPerusahaan,
      logoUrl,
      alamat,
      nomorKontak,
      prefixOrder,
      catatanKakiStruk,
      prefixSpk,
      estimasiHariPengerjaan,
      defaultPendapatanAkunId,
      invoiceRekeningIds,
      email,
    } = body;

    // Serialize array to JSON string if needed
    const invoiceRekeningIdsStr = Array.isArray(invoiceRekeningIds)
      ? JSON.stringify(invoiceRekeningIds)
      : (typeof invoiceRekeningIds === "string" ? invoiceRekeningIds : null);

    const settings = await prisma.appSetting.upsert({
      where: { id: 1 },
      update: {
        namaPerusahaan,
        logoUrl,
        alamat,
        nomorKontak,
        prefixOrder,
        catatanKakiStruk,
        prefixSpk,
        estimasiHariPengerjaan: parseInt(estimasiHariPengerjaan) || 14,
        defaultPendapatanAkunId,
        invoiceRekeningIds: invoiceRekeningIdsStr,
        email,
      },
      create: {
        id: 1,
        namaPerusahaan,
        logoUrl,
        alamat,
        nomorKontak,
        prefixOrder,
        catatanKakiStruk,
        prefixSpk,
        estimasiHariPengerjaan: parseInt(estimasiHariPengerjaan) || 14,
        defaultPendapatanAkunId,
        invoiceRekeningIds: invoiceRekeningIdsStr,
        email,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
