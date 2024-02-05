import { NextResponse, NextRequest } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db/user";
import { hash } from "@/lib/hash";

export const POST = async (req: NextRequest, res: NextResponse) => {
  const data = await req.json();

  const email = data["email"];
  const password = data["password"];

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return NextResponse.json(
      {
        message: "User already exists!",
      },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(password);
  const user = await createUser({
    email,
    password: hashedPassword,
  });

  return NextResponse.json({
    message: "Success!",
    data: user,
  });
};
