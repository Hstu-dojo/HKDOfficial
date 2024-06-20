// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinary";

type Data = {
  result?: any;
  error?: string;
};

export async function GET(request: Request) {
  return NextResponse.json({ message: "not allowed" });
}

export async function POST(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { public_id } = req.body;

  try {
    const result = await cloudinary.v2.uploader.add_tag("favorite", [
      public_id,
    ]);
    res.status(200).json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
