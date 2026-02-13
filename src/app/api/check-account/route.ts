import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // session validation
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const checkAccount = await prisma.account.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        providerId: true,
      },
    });

    return NextResponse.json({
      providerId: checkAccount.map((account) => account.providerId),
    });

  } catch (error) {
    console.error("[CHECK ACCOUNT ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
