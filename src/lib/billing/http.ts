import { NextResponse } from "next/server";
import { BillingError } from "./policy";
export function billingErrorResponse(error: unknown) {
  if (error instanceof BillingError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  console.error("[Billing] Request failed:", error);
  return NextResponse.json(
    { error: "Billing request failed. Please try again." },
    { status: 500 },
  );
}

export async function billingBody(
  request: Request,
): Promise<Record<string, any>> {
  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new BillingError("Provide a JSON object");
  return body;
}
