import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session) {
    return NextResponse.json(session);
  } else if (!session) {
    return NextResponse.redirect("/login");
  } else {
    return NextResponse.next();
  }
}
