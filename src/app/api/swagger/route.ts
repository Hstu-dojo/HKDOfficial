import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger/spec";
import { handleCors, handleOptions } from "@/lib/cors";

export async function GET() {
  const response = NextResponse.json(swaggerSpec);
  return handleCors(response);
}

export async function OPTIONS() {
  return handleOptions();
}
