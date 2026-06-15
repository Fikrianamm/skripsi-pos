import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId } = await params;
    const userId = session.user.id;

    // Temukan semua comment ID untuk order ini
    const comments = await prisma.orderComment.findMany({
      where: { orderId },
      select: { id: true },
    });

    const commentIds = comments.map(c => c.id);

    if (commentIds.length > 0) {
      // Update CommentRecipient menjadi read = true
      await prisma.commentRecipient.updateMany({
        where: {
          userId,
          commentId: { in: commentIds },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json({ message: "Comments marked as read" }, { status: 200 });
  } catch (error) {
    console.error("[MARK COMMENTS READ ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
