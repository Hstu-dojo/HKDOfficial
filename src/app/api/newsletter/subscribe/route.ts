import { NextResponse } from "next/server";
import { subscriptionSchema } from "@/lib/newsletter/model";
import { recordSubscriber, trySyncEmail } from "@/lib/newsletter/server";
import { after } from "next/server";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const input = subscriptionSchema.safeParse(await request.json());
    if (!input.success)
      return NextResponse.json(
        { error: "Enter a valid name and email address" },
        { status: 422 },
      );
    await recordSubscriber(input.data.email, input.data.name);
    after(async () => {
      try {
        await trySyncEmail(input.data.email);
      } catch {
        console.error("[Newsletter] Subscription sync deferred");
      }
    });
    // Identical response for new, duplicate and unsubscribed addresses.
    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to subscribe right now" },
      { status: error instanceof SyntaxError ? 400 : 503 },
    );
  }
}
