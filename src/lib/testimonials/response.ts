import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
export function refreshTestimonials() {
  revalidateTag("testimonials");
  revalidatePath("/[locale]", "page");
}
export function testimonialFailure(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Invalid testimonial data" },
      { status: 400 },
    );
  console.error("[Testimonials] Request failed");
  return NextResponse.json(
    { error: "Unable to load or save testimonials" },
    { status: 500 },
  );
}
