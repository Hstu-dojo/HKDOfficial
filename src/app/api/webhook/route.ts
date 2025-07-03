import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/connect-db";
import { emailLog } from "@/db/schema";

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.json();
  console.log(req.headers);
  const result = await db.insert(emailLog).values({
    payload: data,
  }).returning();
  console.log(result);
  return NextResponse.json({ status: 200, statusText: JSON.stringify(result) });
}
