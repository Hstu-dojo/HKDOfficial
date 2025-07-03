//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/connect-db";
import { user, verificationToken } from "@/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const data = await req.json();

  const email = data["email"];
  const code = data["code"];

  const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existingUser.length === 0) {
    return NextResponse.json(
      {
        message: "User do not exists!",
      },
      { status: 403, statusText: "User do not exists! try creating one" },
    );
  }
  if (existingUser[0]?.emailVerified === true) {
    return NextResponse.json(
      {
        message: "User already verified!",
      },
      { status: 402, statusText: "User already verified!" },
    );
  }

  // match the code with the code in the database of last day
  // get the last day code from the database

  // Get the last day code from the database
  const currentDate = new Date();
  currentDate.setUTCHours(currentDate.getUTCHours() + 0); // Adjusting to UTC+6
  
  const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

  const lastDayCode = await db
    .select()
    .from(verificationToken)
    .where(
      and(
        eq(verificationToken.uid, existingUser[0].id),
        gte(verificationToken.createdAt, startOfDay),
        lt(verificationToken.createdAt, endOfDay)
      )
    )
    .orderBy(desc(verificationToken.createdAt));
    
  // Check if the provided code matches any of the tokens
  const isCodeValid = lastDayCode.some((token) => token.token === code);

  if (!isCodeValid) {
    return NextResponse.json(
      {
        message: "Invalid verification code!",
      },
      { status: 404, statusText: "Invalid verification code given!" },
    );
  }

  // Proceed with the verification process since the code is valid
  // Update the user's emailVerified status
  const updatedUser = await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, existingUser[0].id))
    .returning();

  return NextResponse.json(
    { message: "Verification successful!" },
    { status: 200, statusText: "Verification successful!" },
  );
};
