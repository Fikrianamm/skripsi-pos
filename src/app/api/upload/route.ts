import { NextRequest, NextResponse } from "next/server";
import { uploadToNeo } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "others";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in the 'file' field." },
        { status: 400 },
      );
    }

    // Basic validation
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 },
      );
    }

    // ── Generate Readable Object Key ──────────────────────────────────────────
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const randomString = Math.random().toString(36).substring(2, 6);
    
    // Clean original filename: remove extension, slugify, then add back extension
    const fileExt = file.name.split(".").pop();
    const fileNameWithoutExt = file.name.split(".").slice(0, -1).join(".");
    const cleanBaseName = fileNameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Format: folder/YYYYMMDD-filename-random.ext
    const objectKey = `${folder}/${dateStr}-${cleanBaseName}-${randomString}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await uploadToNeo({
      key: objectKey,
      body: buffer,
      contentType: file.type,
      isPublic: true,
    });

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error("[UPLOAD API ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mengunggah file." },
      { status: 500 },
    );
  }
}
