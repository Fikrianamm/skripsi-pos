import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Removed generated import

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized", status: 401, session: null };
  const allowed = ["admin", "kasir"];
  if (!allowed.includes(session.user.role!))
    return { error: "Forbidden", status: 403, session: null };
  return { error: null, status: 200, session };
}

// GET /api/finance/akun/kelompok
export async function GET() {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const rows = await prisma.akun.groupBy({
      by: ["kelompok"],
      orderBy: { kelompok: "asc" },
    });

    const kelompok = rows.map((r) => r.kelompok);
    return NextResponse.json({ kelompok });
  } catch (err) {
    console.error("[GET_KELOMPOK_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}