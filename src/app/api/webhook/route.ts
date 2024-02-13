import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const data = await req.json();
  console.log(data);
  return NextResponse.json({ message: " successful!", data: data });
}
