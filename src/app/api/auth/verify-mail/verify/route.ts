//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/connect-db";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const data = await req.json();

  const email = data["email"];
  const code = data["code"];

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
  const updatedUser = await prisma?.user?.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: true,
    },
  });

  return NextResponse.json(
    { message: "Verification successful!" },
    { status: 200, statusText: "Verification successful!" },
  );
};
