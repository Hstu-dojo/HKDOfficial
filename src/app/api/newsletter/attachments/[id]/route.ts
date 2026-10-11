import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/connect-db";
import {
  newsletterAttachments as attachments,
  newsletterBroadcasts as broadcasts,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getR2Client, getR2Config } from "@/lib/storage/cloudflare-r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!parsed.success) return new NextResponse(null, { status: 404 });
  try {
    const [row] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, parsed.data))
      .limit(1);
    // Draft uploads remain private. Only attachments in a queued/sent broadcast are public.
    const [published] = await db
      .select({ id: broadcasts.id })
      .from(broadcasts)
      .where(
        and(
          inArray(broadcasts.status, ["sending", "sent", "unknown"]),
          sql`${broadcasts.attachments} @> ${JSON.stringify([parsed.data])}::jsonb`,
        ),
      )
      .limit(1);
    if (!row || !published || !row.key.startsWith("newsletter/attachments/"))
      return new NextResponse(null, { status: 404 });
    const url = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: getR2Config().bucketName,
        Key: row.key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      }),
      { expiresIn: 3600 },
    );
    return NextResponse.redirect(url, {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Attachment temporarily unavailable" },
      { status: 503 },
    );
  }
}
