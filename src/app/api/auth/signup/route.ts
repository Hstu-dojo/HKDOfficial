//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db/user";
import { hash } from "@/lib/hash";
// const uid = require("uid2");
import { prisma } from "@/lib/connect-db";
import accountVerify from "@/actions/emailSend/accountVerify";

export const POST = async (req: NextRequest, res: NextResponse) => {
  // const id = uid(5);
  const data = await req.json();

  const email = data["email"];
  const password = data["password"];

  const existingUser = await prisma?.user?.findFirst({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        message: "User already exists!",
      },
      { status: 400, statusText: "User already exists! try logging in" },
    );
  }

  const hashedPassword = await hash(password);
  const user = await createUser({
    email,
    password: hashedPassword,
  });
  //@ts-ignore
  const verificationToken = await prisma.verificationToken.create({
    data: {
      uid: user.id,
    },
  });

  const emailSendStatus = await accountVerify(email, verificationToken.token);

  return NextResponse.json({
    message: "Success!",
    data: user,
  });
};
