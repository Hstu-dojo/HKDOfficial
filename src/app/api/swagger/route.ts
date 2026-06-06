import { NextRequest, NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger/spec";
import { handleCors, handleOptions } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const response = NextResponse.json(swaggerSpec);
  return handleCors(response, req.headers.get('origin'));
}

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get('origin'));
}
