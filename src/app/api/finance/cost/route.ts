import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJurnalDoubleEntry } from "@/lib/finance";

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  if (session.user.role !== "admin" && session.user.role !== "kasir")
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/cost
export async function GET() {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const costs = await prisma.cost.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        costCategory: true,
        user: { select: { id: true, name: true } },
      },
      take: 100,
    });
    return NextResponse.json({ costs });
  } catch (err) {
    console.error("[COST GET ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/finance/cost
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { costCategoryId, nama, nominal, keterangan, buktiNota, tanggal, kasBankId } = body;

    if (!nominal || nominal <= 0)
      return NextResponse.json({ error: "Nominal harus lebih dari 0." }, { status: 400 });
    
    if (!kasBankId)
      return NextResponse.json({ error: "Rekening Kas/Bank sumber dana harus dipilih." }, { status: 400 });

    const kasBank = await prisma.kasBank.findUnique({
      where: { id: kasBankId },
      include: { akun: true },
    });
    if (!kasBank || !kasBank.akunId)
      return NextResponse.json({ error: "Rekening sumber dana Kas/Bank tidak valid." }, { status: 400 });

    const category = await prisma.costCategory.findUnique({
      where: { id: costCategoryId },
    });
    if (!category || !category.akunId)
      return NextResponse.json({ error: "Cost Category tidak valid atau tidak memiliki pemetaan Akun Jurnal." }, { status: 400 });

    const costId = crypto.randomUUID();
    const realTanggal = tanggal ? new Date(tanggal) : new Date();

    const [cost] = await prisma.$transaction(async (tx) => {
      // 1. Catat Pengeluaran
      const newCost = await tx.cost.create({
        data: {
          id: costId,
          costCategoryId,
          userId: session.user.id,
          nama,
          nominal: Number(nominal),
          keterangan: keterangan || null,
          buktiNota: buktiNota || null,
          tanggal: realTanggal,
        },
      });

      // 2. Kurangi Saldo KasBank (karena ini pengeluaran)
      await tx.kasBank.update({
        where: { id: kasBankId },
        data: { saldoSaatIni: { decrement: Number(nominal) } },
      });

      // 3. Catat Jurnal UMUM (Double-Entry)
      //    Debet = Akun Beban (dari CostCategory), Kredit = Akun Kas/Bank
      await createJurnalDoubleEntry({
        ref: `CST-${costId.slice(0, 5)}`,
        tanggal: realTanggal,
        keterangan: `Pengeluaran: ${nama} - ${keterangan || ""}`,
        akunDebetId: category.akunId!, 
        akunKreditId: kasBank.akunId!,
        nominal: Number(nominal),
        sumber: "COST" as any,
        divisi: "HQ" as any, // Pengeluaran umum masuk HQ kecuali ditentukan lain
        costId: costId,
        createdById: session.user.id,
      }, tx as any);

      return [newCost];
    });

    return NextResponse.json({ message: "Pengeluaran berhasil dicatat", cost }, { status: 201 });
  } catch (err) {
    console.error("[COST CREATE ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
