import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ count: 0 }, { status: 401 });

    const userId = session.user.id;

    const count = await prisma.commentRecipient.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET UNREAD COMMENTS ERROR]", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
