import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToNeo, deleteFromNeo } from "@/lib/storage";
import path from "path";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_ROLES = ["admin", "designer"];
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

async function requireDesignAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized.", status: 401, session: null };
  if (!session.user.role || !ALLOWED_ROLES.includes(session.user.role))
    return {
      error: "Forbidden. Hanya admin dan designer.",
      status: 403,
      session: null,
    };
  return { error: null, status: 200, session };
}

// ── POST /api/order/[id]/design-files — Upload file desain ke Neo S3 ──────────
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, status, session } = await requireDesignAccess();
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
    const file = formData.get("file") as File | null;
    const nama = (formData.get("nama") as string | null)?.trim();

    if (!file)
      return NextResponse.json(
        { error: "File tidak boleh kosong." },
        { status: 400 },
      );
    if (!nama)
      return NextResponse.json(
        { error: "Nama file tidak boleh kosong." },
        { status: 400 },
      );
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json(
        { error: "Ukuran file maksimal 10 MB." },
        { status: 400 },
      );
    if (!ALLOWED_MIME.includes(file.type))
      return NextResponse.json(
        {
          error:
            "Tipe file tidak diizinkan. Gunakan JPG, PNG, PDF, AI, PSD, atau ZIP.",
        },
        { status: 400 },
      );

    // ── Upload ke Neo Object Storage ──────────────────────────────────────────
    const ext = path.extname(file.name) || "";
    const fileId = crypto.randomUUID();
    const s3Key = `design/${orderId}/${fileId}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file asli
    const fileUrl = await uploadToNeo({
      key: s3Key,
      body: buffer,
      contentType: file.type,
    });

    // ── Simpan ke DB ──────────────────────────────────────────────────────────
    const designFile = await prisma.designFile.create({
      data: {
        id: fileId,
        orderId,
        nama,
        filePath: fileUrl, // URL publik Neo S3
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        nama: true,
        filePath: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ designFile }, { status: 201 });
  } catch (err) {
    console.error("[DESIGN FILE UPLOAD ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}

// ── DELETE /api/order/[id]/design-files — Hapus dari Neo S3 + DB ──────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { error, status } = await requireDesignAccess();
    if (error) return NextResponse.json({ error }, { status });

    const { id: orderId } = await params;
    const body = await req.json();
    const { designFileId } = body as { designFileId?: string };

    if (!designFileId)
      return NextResponse.json(
        { error: "designFileId diperlukan." },
        { status: 400 },
      );

    const designFile = await prisma.designFile.findUnique({
      where: { id: designFileId },
      select: { id: true, orderId: true, filePath: true },
    });

    if (!designFile)
      return NextResponse.json(
        { error: "File tidak ditemukan." },
        { status: 404 },
      );
    if (designFile.orderId !== orderId)
      return NextResponse.json(
        { error: "File tidak dimiliki oleh order ini." },
        { status: 400 },
      );

    // ── Hapus dari Neo S3 (tidak throw jika sudah tidak ada) ──────────────────
    try {
      await deleteFromNeo(designFile.filePath);
    } catch (e) {
      console.warn("[DESIGN FILE DELETE S3 WARNING]", e);
    }

    await prisma.designFile.delete({ where: { id: designFileId } });

    return NextResponse.json({ message: "File berhasil dihapus." });
  } catch (err) {
    console.error("[DESIGN FILE DELETE ERROR]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
