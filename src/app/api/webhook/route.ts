import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/connect-db";

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.json();
  const result = prisma?.emailLog.create({
    //@ts-ignore
    payload: data || {},
  });
  console.log(result);
  return NextResponse.json({ status: 200, statusText: JSON.stringify(result) });
}
