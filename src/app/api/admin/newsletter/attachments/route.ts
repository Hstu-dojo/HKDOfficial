import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/connect-db";
import { newsletterAttachments } from "@/db/schema";
import { newsletterAccess } from "@/lib/newsletter/access";
import {
  isR2Configured,
  uploadToR2,
  deleteFromR2,
} from "@/lib/storage/cloudflare-r2";
export async function POST(request: Request) {
  const { error } = await newsletterAccess("CREATE");
  if (error) return error;
  if (!isR2Configured())
    return NextResponse.json(
      { error: "Cloudflare R2 is not configured" },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > 4.5 * 1000000)
    return NextResponse.json(
      { error: "Maximum file size is 4 MB" },
      { status: 413 },
    );
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File) || !file.size || file.size > 4 * 1024 * 1024)
      return NextResponse.json(
        { error: "Choose a file up to 4 MB" },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const supported: Record<string, boolean> = {
      "application/pdf": bytes.subarray(0, 5).toString() === "%PDF-",
      "image/jpeg": bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      "image/png": bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "image/webp":
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP",
    };
    if (!supported[file.type])
      return NextResponse.json(
        { error: "Use a PDF, JPEG, PNG or WebP file" },
        { status: 422 },
      );
    const id = randomUUID(),
      key = `newsletter/attachments/${id}`,
      name = file.name.replace(/[\\/\r\n\x00-\x1f]/g, "_").slice(0, 120);
    await uploadToR2({ key, body: bytes, contentType: file.type });
    try {
      await db
        .insert(newsletterAttachments)
        .values({ id, key, name, type: file.type, bytes: file.size });
    } catch (error) {
      await deleteFromR2(key).catch(() => {});
      throw error;
    }
    return NextResponse.json({ id, name }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload attachment" },
      { status: 500 },
    );
  }
}
