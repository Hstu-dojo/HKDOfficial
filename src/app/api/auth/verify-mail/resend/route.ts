//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
const uid = require("uid2");
import { db } from "@/lib/connect-db";
import { user, verificationToken } from "@/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import accountVerify from "@/actions/emailSend/accountVerify";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const id = uid(5);
  const data = await req.json();

  const email = data["email"];

  const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existingUser.length === 0) {
    return NextResponse.json(
      {
        message: "User do not exists!",
      },
      { status: 403, statusText: "User do not exists! try creating one" },
    );
  }
  
  const userRecord = existingUser[0];
  if (userRecord?.emailVerified === true) {
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
        eq(verificationToken.uid, userRecord.id),
        gte(verificationToken.createdAt, startOfDay),
        lt(verificationToken.createdAt, endOfDay)
      )
    )
    .orderBy(desc(verificationToken.createdAt));

  if (lastDayCode?.length > 3) {
    return NextResponse.json(
      {
        message: `Code already sent today: ${lastDayCode.length} times!`,
      },
      {
        status: 404,
        statusText:
          "Code already sent today!. You can request maximum 3 mails per day!",
      },
    );
  }

  const newVerificationToken = await db.insert(verificationToken).values({
    uid: userRecord.id,
    token: id,
  }).returning();

  const emailSendStatus = await accountVerify(email, newVerificationToken[0].token);

  return NextResponse.json({
    message: "Success!",
    data: emailSendStatus,
  });
};
