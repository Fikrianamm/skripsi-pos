import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Neo Object Storage (Biznet Neo) — S3-compatible
 * Panel:    https://portal.neo.id
 *
 * Required env vars:
 *   NEO_S3_ACCESS_KEY   — Access Key dari panel Neo
 *   NEO_S3_SECRET_KEY   — Secret Key dari panel Neo
 *   NEO_S3_BUCKET       — nama bucket (e.g. haqi-design-files)
 *   NEO_S3_ENDPOINT     — endpoint Neo (e.g. https://nos.jkt-1.neo.id)
 *   NEO_S3_PUBLIC_URL   — base URL publik (e.g. https://haqi-design-files.nos.jkt-1.neo.id)
 */

// Strip any "https://" or "http://" prefix yang mungkin sudah ada di env var
const rawEndpoint = (process.env.NEO_S3_ENDPOINT ?? "nos.wjv-1.neo.id").replace(
  /^https?:\/\//,
  "",
);

// Ekstrak region dari sub-domain endpoint: nos.jkt-1.neo.id → jkt-1
const region = rawEndpoint.match(/nos\.([^.]+)\.neo\.id/)?.[1] ?? "wjv-1";

const BUCKET = process.env.NEO_S3_BUCKET ?? "";
const BASE_URL =
  process.env.NEO_S3_PUBLIC_URL ?? `https://${BUCKET}.${rawEndpoint}`;

export const s3 = new S3Client({
  region,
  endpoint: `https://${rawEndpoint}`,
  credentials: {
    accessKeyId: process.env.NEO_S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.NEO_S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

// ── Upload ─────────────────────────────────────────────────────────────────────

/**
 * Upload file ke Neo Object Storage.
 * @returns URL publik file
 */
export async function uploadToNeo({
  key,
  body,
  contentType,
  isPublic = true,
}: {
  key: string;
  body: Buffer;
  contentType: string;
  isPublic?: boolean;
}): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: isPublic ? "public-read" : "private",
    }),
  );
  return `${BASE_URL}/${key}`;
}

// ── Delete ─────────────────────────────────────────────────────────────────────

/**
 * Hapus file dari Neo Object Storage berdasarkan key atau URL publik.
 */
export async function deleteFromNeo(keyOrUrl: string): Promise<void> {
  let key = keyOrUrl;
  if (key.startsWith(BASE_URL)) {
    key = key.slice(BASE_URL.length + 1);
  } else if (key.startsWith("https://") || key.startsWith("http://")) {
    key = new URL(key).pathname.replace(/^\//, "");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}
