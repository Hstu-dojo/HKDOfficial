import "server-only";
import { db } from "@/lib/connect-db";
import {
  monthlyFees,
  monthlyFeeEvents,
  courseEnrollments,
  courses,
  profiles,
  partners,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { BillingError } from "./policy";
import { transitionFee } from "./transitions";
import { billingActivity, type BillingScope } from "./service";
export async function updateFee(
  id: string,
  input: Record<string, unknown>,
  actor: string,
  scope: BillingScope = {},
  profileId?: string,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ fee: monthlyFees })
      .from(monthlyFees)
      .innerJoin(
        courseEnrollments,
        eq(monthlyFees.enrollmentId, courseEnrollments.id),
      )
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .innerJoin(profiles, eq(monthlyFees.profileId, profiles.id))
      .leftJoin(partners, eq(courses.partnerId, partners.id))
      .where(
        and(
          profileId ? billingActivity() : undefined,
          eq(monthlyFees.id, id),
          scope.partnerId ? eq(courses.partnerId, scope.partnerId) : undefined,
          profileId ? eq(monthlyFees.profileId, profileId) : undefined,
        ),
      )
      .for("update", { of: monthlyFees });
    if (!row) throw new BillingError("Fee not found", 404);
    const patch = transitionFee(
      row.fee,
      input,
      actor.startsWith("user:") ? actor.slice(5) : null,
    );
    const [updated] = await tx
      .update(monthlyFees)
      .set(patch)
      .where(eq(monthlyFees.id, id))
      .returning();
    await tx.insert(monthlyFeeEvents).values({
      monthlyFeeId: id,
      actor,
      action: String(input.action),
      previous: { status: row.fee.status, amountPaid: row.fee.amountPaid },
      next: { ...patch },
    });
    return updated;
  });
}
