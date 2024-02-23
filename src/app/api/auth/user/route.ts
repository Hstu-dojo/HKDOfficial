import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const GET = async (req: NextRequest, res: NextResponse) => {
  const token = await getToken({ req });
  if (token) {
    console.log(token);
    console.log("JSON Web Token", JSON.stringify(token, null, 2));
  } else {
    // Not Signed in
    console.log("No token");
  }
  return NextResponse.json({
    message: "Success!",
    data: token,
  });
};
