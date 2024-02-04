import accountVerify from "@/actions/emailSend/accountVerify";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const email = await accountVerify();
  return NextResponse.json(email);
}
