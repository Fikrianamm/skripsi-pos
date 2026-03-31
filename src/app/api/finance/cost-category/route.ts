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

    const categories = await prisma.costCategory.findMany({
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        jenisBeban: true,
        akunId: true,
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[COST_CATEGORY_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
