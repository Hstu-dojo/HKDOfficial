//@ts-nocheck
import { NextResponse, NextRequest } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db/user";
import { hash } from "@/lib/hash";
const uid = require("uid2");
import { db } from "@/lib/connect-db";
import { user, verificationToken } from "@/db/schema";
import { eq } from "drizzle-orm";
import accountVerify from "@/actions/emailSend/accountVerify";
import { handleCors, handleOptions } from "@/lib/cors";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const id = uid(5);
  // console.log(id);
  const data = await req.json();

  const email = data["email"];
  const password = data["password"];
  const userName = data["userName"];
  const userAvatar = data["userAvatar"];

  const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existingUser.length > 0) {
    const response = NextResponse.json(
      {
        message: "User already exists!",
      },
      { status: 400, statusText: "User already exists! try logging in" },
    );
    return handleCors(response);
  }
  const existingUserName = await db.select().from(user).where(eq(user.userName, userName)).limit(1);

  if (existingUserName.length > 0) {
    const response = NextResponse.json(
      {
        message: "Username already exists!, or wrong input.",
      },
      {
        status: 400,
        statusText: "Username already taken! try different username",
      },
    );
    return handleCors(response);
  }

  const hashedPassword = await hash(password);
  const newUser = await createUser({
    email,
    password: hashedPassword,
    userName,
    userAvatar,
  });
  //@ts-ignore
  const verificationTokenResult = await db.insert(verificationToken).values({
    uid: newUser.id,
    token: id,
  }).returning();

  const emailSendStatus = await accountVerify(email, verificationTokenResult[0].token);

  const response = NextResponse.json({
    message: "Success!",
    data: newUser,
  });
  
  return handleCors(response);
};

export async function OPTIONS() {
  return handleOptions();
}
