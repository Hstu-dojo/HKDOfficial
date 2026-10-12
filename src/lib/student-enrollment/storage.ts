import { encryptStudentDocument, decryptStudentDocument } from "./encryption";
import "server-only";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Client, getR2Config } from "@/lib/storage/cloudflare-r2";
import sharp from "sharp";
export const maxUploadBytes = 3 * 1024 * 1024;
export function documentBucket() {
  return (
    process.env.CLOUDFLARE_R2_STUDENT_BUCKET_NAME?.trim() ||
    getR2Config().bucketName
  );
}
export async function readDocument(bucket: string, key: string) {
  const response = await getR2Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!response.Body) throw Error("Document unavailable");
  return decryptStudentDocument(
    Buffer.from(await response.Body.transformToByteArray()),
  );
}
export async function putDocument(
  bucket: string,
  key: string,
  body: Buffer,
  type: string,
) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: encryptStudentDocument(body),
      ContentType: "application/octet-stream",
      Metadata: { "student-document-encryption": "aes-256-gcm-v1" },
      CacheControl: "private, no-store",
    }),
  );
}
export async function removeDocument(bucket: string, key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}
export async function validateFile(file: File, imagesOnly = false) {
  if (!file.size || file.size > maxUploadBytes)
    throw Error("Upload a file smaller than 3 MB");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (
    !imagesOnly &&
    file.type === "application/pdf" &&
    buffer.subarray(0, 5).toString() === "%PDF-"
  )
    return {
      buffer,
      type: "application/pdf",
      extension: "pdf",
      original: buffer,
      originalType: "application/pdf",
      originalExtension: "pdf",
    };
  const metadata = await sharp(buffer, {
    limitInputPixels: 30_000_000,
  }).metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format || "") ||
    !metadata.width ||
    !metadata.height
  )
    throw Error("Use a JPEG, PNG, WebP image or PDF document");
  const clean = await sharp(buffer, { limitInputPixels: 30_000_000 })
    .rotate()
    .resize({
      width: 2200,
      height: 2600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88 })
    .toBuffer();
  if (clean.length > maxUploadBytes)
    throw Error("Upload a smaller image; processed preview exceeds 3 MB");
  return {
    buffer: clean,
    type: "image/jpeg",
    extension: "jpg",
    original: buffer,
    originalType: `image/${metadata.format}`,
    originalExtension: metadata.format === "jpeg" ? "jpg" : metadata.format!,
  };
}
export async function cropDocument(buffer: Buffer, box: number[]) {
  const metadata = await sharp(buffer).metadata();
  const [y1, x1, y2, x2] = box;
  const left = Math.floor((x1 * metadata.width!) / 1000),
    top = Math.floor((y1 * metadata.height!) / 1000);
  const width = Math.min(
      metadata.width! - left,
      Math.max(1, Math.ceil(((x2 - x1) * metadata.width!) / 1000)),
    ),
    height = Math.min(
      metadata.height! - top,
      Math.max(1, Math.ceil(((y2 - y1) * metadata.height!) / 1000)),
    );
  return sharp(buffer)
    .extract({ left, top, width, height })
    .resize({
      width: 600,
      height: 600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}
