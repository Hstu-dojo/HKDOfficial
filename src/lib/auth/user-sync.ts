import { db } from "@/lib/connect-db";
import { user } from "@/db/schemas/auth";
import { eq } from "drizzle-orm";

export interface SupabaseUserLike {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
  email_confirmed_at?: string | null;
  identities?: Array<{
    provider: string;
    id?: string;
    identity_data?: Record<string, any>;
    created_at?: string;
    last_sign_in_at?: string;
  }> | null;
}

/**
 * Ensures that an authenticated Supabase user has a corresponding
 * local PostgreSQL `user` record in the database.
 *
 * 1. Checks by `supabaseUserId`.
 * 2. If not found, checks by `email` and links `supabaseUserId`.
 * 3. If not found, creates a new user with a unique `userName` and pre-filled metadata.
 *
 * This guarantees that subsequent queries referencing `user.id` (e.g. registrations,
 * onboarding, courses, profiles, enrollments) will never fail with "User profile not found".
 */
export async function ensureUserExists(supabaseUser: SupabaseUserLike) {
  if (!supabaseUser?.id) {
    throw new Error("ensureUserExists requires a valid Supabase user ID");
  }

  // 1. Try finding existing record by supabaseUserId
  const existingBySupabaseId = await db
    .select()
    .from(user)
    .where(eq(user.supabaseUserId, supabaseUser.id))
    .limit(1);

  if (existingBySupabaseId.length > 0) {
    const existing = existingBySupabaseId[0];
    const updates: Record<string, any> = {};

    // Sync email verification if confirmed in Supabase
    if (supabaseUser.email_confirmed_at && !existing.emailVerified) {
      updates.emailVerified = true;
      existing.emailVerified = true;
    }

    // Sync email if missing in local record
    if (supabaseUser.email && !existing.email) {
      updates.email = supabaseUser.email;
      existing.email = supabaseUser.email;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db
        .update(user)
        .set(updates)
        .where(eq(user.id, existing.id));
    }
    return existing;
  }

  // 2. Try finding existing record by email (e.g. previously created with password or pre-registered)
  if (supabaseUser.email) {
    const existingByEmail = await db
      .select()
      .from(user)
      .where(eq(user.email, supabaseUser.email))
      .limit(1);

    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0];
      console.log(`🔗 Linking existing user ${existing.id} (${existing.email}) to supabaseUserId ${supabaseUser.id}`);
      
      const [updated] = await db
        .update(user)
        .set({
          supabaseUserId: supabaseUser.id,
          emailVerified: supabaseUser.email_confirmed_at ? true : existing.emailVerified,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existing.id))
        .returning();

      return updated;
    }
  }

  // 3. User does not exist locally; create a new record
  console.log(`🆕 Auto-provisioning local user for Supabase user: ${supabaseUser.id} (${supabaseUser.email ?? 'no email'})`);

  const rawName =
    supabaseUser.user_metadata?.username ||
    supabaseUser.user_metadata?.user_name ||
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    (supabaseUser.email ? supabaseUser.email.split("@")[0] : "user");

  // Sanitize base username for URL / alphanumeric safety
  const baseName =
    String(rawName)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 24) || "user";

  // Ensure username uniqueness against the unique constraint
  let candidateUsername = baseName;
  let attempts = 0;
  while (attempts < 8) {
    const conflict = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.userName, candidateUsername))
      .limit(1);

    if (conflict.length === 0) {
      break;
    }
    candidateUsername = `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`;
    attempts++;
  }

  const userAvatar =
    supabaseUser.user_metadata?.avatar_url ||
    supabaseUser.user_metadata?.picture ||
    supabaseUser.user_metadata?.avatar ||
    "/image/avatar/Milo.svg";

  const identities = supabaseUser.identities || [];
  const authProviders =
    identities.length > 0
      ? identities.map((i) => ({
          provider: i.provider,
          providerId: i.id || supabaseUser.id,
          email: i.identity_data?.email || supabaseUser.email || "",
          linkedAt: i.created_at || new Date().toISOString(),
        }))
      : [
          {
            provider: "oauth",
            providerId: supabaseUser.id,
            email: supabaseUser.email || "",
            linkedAt: new Date().toISOString(),
          },
        ];

  try {
    const [created] = await db
      .insert(user)
      .values({
        supabaseUserId: supabaseUser.id,
        email: supabaseUser.email || null,
        emailVerified: Boolean(supabaseUser.email_confirmed_at),
        password: `supabase_${supabaseUser.id}`,
        userName: candidateUsername,
        userAvatar,
        defaultRole: "GUEST",
        hasPassword: identities.some((i) => i.provider === "email"),
        authProviders: authProviders as any,
      })
      .returning();

    console.log(`✅ Local user record created successfully: ${created.id} (${created.userName})`);
    return created;
  } catch (err: any) {
    // If a concurrent insert occurred, attempt a final re-fetch
    console.warn("⚠️ Race condition detected during user insertion, re-querying:", err.message);
    const retry = await db
      .select()
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUser.id))
      .limit(1);

    if (retry.length > 0) {
      return retry[0];
    }
    throw err;
  }
}
