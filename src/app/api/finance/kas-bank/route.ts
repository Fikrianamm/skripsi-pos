import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kasBanks = await prisma.kasBank.findMany({
      where: { isActive: true },
      orderBy: { jenisRekening: "asc" },
      select: {
        id: true,
        namaRekening: true,
        jenisRekening: true,
        nomorRekening: true,
        saldoSaatIni: true,
      },
    });

    return NextResponse.json({ kasBanks });
  } catch (error) {
    console.error("[KAS_BANK_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
