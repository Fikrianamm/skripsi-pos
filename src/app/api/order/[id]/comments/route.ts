import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo } from "@/lib/storage";
import path from "path";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_ROLES = ["admin", "designer", "produksi", "kasir", "gudang"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/postscript", // .ai / .eps
  "image/vnd.adobe.photoshop", // .psd
  "application/zip",
  "application/x-zip-compressed",
];

async function requireAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401, session: null };
  if (!session.user.role || !ALLOWED_ROLES.includes(session.user.role))
    return {
      error: "Forbidden. Anda tidak memiliki akses.",
      status: 403,
      session: null,
    };
  return { error: null, status: 200, session };
}

// ── GET /api/order/[id]/comments — Fetch comment thread ───────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;

    const comments = await prisma.orderComment.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        files: {
          select: {
            id: true,
            filePath: true,
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[GET COMMENTS ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}

// ── POST /api/order/[id]/comments — Post a new comment with attachments ────────
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireAccess();
    if (error || !session) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const text = (formData.get("text") as string | null)?.trim() || "";
    const files = formData.getAll("files") as File[];

    if (!text && files.length === 0) {
      return NextResponse.json(
        { error: "Komentar atau file tidak boleh kosong." },
        { status: 400 },
      );
    }

    // Validate all files first
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ukuran file "${file.name}" melebihi batas 10 MB.` },
          { status: 400 },
        );
      }
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipe file "${file.name}" tidak diizinkan. Gunakan JPG, PNG, PDF, AI, PSD, atau ZIP.` },
          { status: 400 },
        );
      }
    }

    // ── Upload all files to Neo ──
    const uploadedFilePaths: string[] = [];
    for (const file of files) {
      const ext = path.extname(file.name) || "";
      const fileId = crypto.randomUUID();
      const s3Key = `comments/${orderId}/${fileId}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileUrl = await uploadToNeo({
        key: s3Key,
        body: buffer,
        contentType: file.type,
      });
      uploadedFilePaths.push(fileUrl);
    }

    // ── Save Comment and attachments to DB ──
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.orderComment.create({
        data: {
          orderId,
          userId: session.user.id,
          text,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
      });

      if (uploadedFilePaths.length > 0) {
        await tx.orderCommentFile.createMany({
          data: uploadedFilePaths.map((path) => ({
            commentId: newComment.id,
            filePath: path,
          })),
        });
      }

      const filesData = await tx.orderCommentFile.findMany({
        where: { commentId: newComment.id },
        select: { id: true, filePath: true },
      });

      return {
        ...newComment,
        files: filesData,
      };
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("[POST COMMENT ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan komentar." },
      { status: 500 },
    );
  }
}
