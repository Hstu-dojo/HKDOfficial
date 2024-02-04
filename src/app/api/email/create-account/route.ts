import accountVerify from "@/actions/emailSend/accountVerify";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const email = await accountVerify();
  console.log(email);
  return NextResponse.json(JSON.stringify(email));
}
