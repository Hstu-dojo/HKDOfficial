//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
const uid = require("uid2");
import { prisma } from "@/lib/connect-db";
import accountVerify from "@/actions/emailSend/accountVerify";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const id = uid(5);
  const data = await req.json();

  const email = data["email"];

  const existingUser = await prisma?.user?.findFirst({
    where: {
      email: email,
    },
  });

  if (!existingUser) {
    return NextResponse.json(
      {
        message: "User do not exists!",
      },
      { status: 403, statusText: "User do not exists! try creating one" },
    );
  }
  if (existingUser?.emailVerified === true) {
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
  // Get the last day code from the database
  const currentDate = new Date();
  currentDate.setUTCHours(currentDate.getUTCHours() + 0); // Adjusting to UTC+6

  const lastDayCode = await prisma?.verificationToken?.findMany({
    where: {
      uid: existingUser.id,
      created_at: {
        gte: new Date(currentDate.setHours(0, 0, 0, 0)), // Filter for today's date in UTC+6
        lt: new Date(currentDate.setHours(23, 59, 59, 999)), // Filter for today's date in UTC+6
      },
    },
    orderBy: {
      created_at: "desc", // Order by createdAt in descending order to get the latest entry
    },
  });

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

  const verificationToken = await prisma.verificationToken.create({
    data: {
      uid: existingUser.id,
      token: id,
    },
  });

  const emailSendStatus = await accountVerify(email, verificationToken.token);

  return NextResponse.json({
    message: "Success!",
    data: emailSendStatus,
  });
};
