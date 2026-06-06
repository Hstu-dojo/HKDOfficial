import crypto from 'crypto';
import { db } from '@/lib/connect-db';
import {
  oauth2AuthorizationCodes,
  oauth2RefreshTokens,
  oauth2TokenInvalidations,
  user,
  profiles,
} from '@/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getUserPermissionsWithFallback } from '@/lib/rbac/permissions';

export const STUDENT_LEVELS = [
  'student_9th_kyu',
  'student_8th_kyu',
  'student_7th_kyu',
  'student_6th_kyu',
  'student_5th_kyu',
  'student_4th_kyu',
  'student_3rd_kyu',
  'student_2nd_kyu',
  'student_1st_kyu',
  'black_belt',
] as const;

export type StudentLevel = (typeof STUDENT_LEVELS)[number];

export const EXTERNAL_SYSTEM_ROLES = ['admin', 'teacher', 'partner', 'none', ...STUDENT_LEVELS] as const;
export type ExternalSystemRole = (typeof EXTERNAL_SYSTEM_ROLES)[number];

type OAuthCodeCreateInput = {
  clientId: string
  redirectUri: string
  scope: string
  userId: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_BYTES = 48; // 48 bytes => long random token (base64url)
const REFRESH_TOKEN_TTL_DAYS = 180;

function getTokenHashPepper(): string {
  const pepper = (process.env.OAUTH_TOKEN_HASH_PEPPER || '').trim();
  if (pepper) return pepper;

  // Fallback to avoid hard failures if the env var isn't set yet.
  // Prefer setting OAUTH_TOKEN_HASH_PEPPER explicitly (separate from JWT secret).
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  if (jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[oauth2] OAUTH_TOKEN_HASH_PEPPER is not configured; falling back to JWT_SECRET. Set OAUTH_TOKEN_HASH_PEPPER to avoid coupling token hashing to JWT signing.'
      );
    }
    return jwtSecret;
  }

  throw new Error('OAUTH_TOKEN_HASH_PEPPER (or JWT_SECRET fallback) not configured in environment');
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function hashWithPepper(value: string): string {
  const pepper = getTokenHashPepper()
  return sha256Hex(`${pepper}:${value}`)
}

function randomToken(bytes: number): string {
  // Node supports base64url in modern versions; fall back if needed.
  try {
    return crypto.randomBytes(bytes).toString('base64url')
  } catch {
    return crypto.randomBytes(bytes).toString('hex')
  }
}

// JWT helpers for stateless access tokens
function getJwtSecret(): string {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET not configured in environment');
  }
  return secret;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

function signJWT(payload: Record<string, unknown>, expiresInSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const jwtPayload = {
    ...payload,
    iat: now,
    exp,
    iss: 'hkd-auth-server',
    aud: 'dojo-video-server',
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(jwtPayload));
  const message = `${headerEncoded}.${payloadEncoded}`;

  const secret = getJwtSecret();
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(message).digest('base64')
  );

  return `${message}.${signature}`;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: ExternalSystemRole;
  clientId?: string;
  jti?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[verifyJWT] Invalid JWT format: wrong number of parts');
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    // Verify signature
    const message = `${headerEncoded}.${payloadEncoded}`;
    const secret = getJwtSecret();
    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(message).digest('base64')
    );

    if (signatureEncoded !== expectedSignature) {
      console.warn('[verifyJWT] Signature verification failed');
      return null;
    }

    // Decode and parse payload
    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload = JSON.parse(payloadJson) as JWTPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      console.warn('[verifyJWT] Token has expired');
      return null;
    }

    // Verify issuer and audience
    if (payload.iss !== 'hkd-auth-server' || payload.aud !== 'dojo-video-server') {
      console.warn('[verifyJWT] Invalid issuer or audience');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[verifyJWT] Error verifying JWT:', error);
    return null;
  }
}

export function getRegisteredClients() {
  const raw = process.env.OAUTH_REGISTERED_CLIENTS || 'dojo-app';
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

export function getRegisteredClientSecret(clientId: string): string | null {
  const raw = (process.env.OAUTH_CLIENT_SECRETS || '').trim()
  if (!raw) return null

  // Format: clientA=secretA,clientB=secretB
  const pairs = raw.split(',').map((v) => v.trim()).filter(Boolean)
  for (const p of pairs) {
    const idx = p.indexOf('=')
    if (idx <= 0) continue
    const id = p.slice(0, idx).trim()
    const secret = p.slice(idx + 1).trim()
    if (id === clientId && secret) return secret
  }
  return null
}

export function isConfidentialClient(clientId: string): boolean {
  return !!getRegisteredClientSecret(clientId)
}

export function isRegisteredClient(clientId: string) {
  return getRegisteredClients().includes(clientId);
}

export async function createAuthorizationCode(payload: OAuthCodeCreateInput) {
  const code = randomToken(32);
  const codeHash = hashWithPepper(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_CODE_TTL_MS);

  await db.insert(oauth2AuthorizationCodes).values({
    codeHash,
    clientId: payload.clientId,
    redirectUri: payload.redirectUri,
    scope: payload.scope ?? '',
    userId: payload.userId,
    codeChallenge: payload.codeChallenge,
    codeChallengeMethod: payload.codeChallengeMethod,
    expiresAt,
  });

  return code;
}

export async function consumeAuthorizationCode(code: string) {
  const codeHash = hashWithPepper(code);
  const now = new Date();

  const existing = await db
    .select()
    .from(oauth2AuthorizationCodes)
    .where(eq(oauth2AuthorizationCodes.codeHash, codeHash))
    .limit(1);

  if (existing.length === 0) return { ok: false as const, reason: 'missing' as const };
  if (existing[0].usedAt) return { ok: false as const, reason: 'reused' as const };
  if (existing[0].expiresAt.getTime() <= now.getTime()) return { ok: false as const, reason: 'expired' as const };
  return { ok: true as const, code: existing[0] };
}

export async function markAuthorizationCodeUsed(code: string) {
  const codeHash = hashWithPepper(code);
  const now = new Date();

  const updated = await db
    .update(oauth2AuthorizationCodes)
    .set({ usedAt: now })
    .where(
      and(
        eq(oauth2AuthorizationCodes.codeHash, codeHash),
        isNull(oauth2AuthorizationCodes.usedAt),
        gt(oauth2AuthorizationCodes.expiresAt, now)
      )
    )
    .returning({ id: oauth2AuthorizationCodes.id });

  return updated.length > 0;
}

export function isPlaceholderState(state: string) {
  const normalized = state.trim().toLowerCase();
  return (
    normalized === '<state>' ||
    normalized === 'state' ||
    normalized === '{state}' ||
    normalized === '{{state}}'
  );
}

export function createAccessToken(input: {
  userId: string;
  role: ExternalSystemRole;
  email: string;
  clientId: string;
}) {
  const jti = randomToken(16);
  const jwt = signJWT(
    {
    sub: input.userId, // subject = profile ID
    userId: input.userId, // also include as userId for convenience
    email: input.email,
    role: input.role,
    clientId: input.clientId,
    jti,
    },
    ACCESS_TOKEN_TTL_SECONDS
  );

  // Note: access tokens are short-lived; revocation is handled via oauth2_token_invalidations.

  console.log('[createAccessToken] New JWT token issued');
  console.log('[createAccessToken] Token first 20 chars:', jwt.substring(0, 20));
  console.log('[createAccessToken] ProfileId:', input.userId);
  console.log('[createAccessToken] Email:', input.email);
  console.log('[createAccessToken] Role:', input.role);
  console.log('[createAccessToken] ClientId:', input.clientId);
  console.log('[createAccessToken] Token is stateless (no store needed)');

  return {
    token: jwt,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function issueRefreshToken(input: {
  userId: string
  clientId: string
  userAgent?: string | null
  ip?: string | null
  familyId?: string
}) {
  const familyId = input.familyId ?? crypto.randomUUID()
  const token = randomToken(REFRESH_TOKEN_BYTES)
  const tokenHash = hashWithPepper(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  const inserted = await db
    .insert(oauth2RefreshTokens)
    .values({
      familyId,
      userId: input.userId,
      clientId: input.clientId,
      tokenHash,
      issuedAt: now,
      expiresAt,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      lastUsedAt: now,
    })
    .returning({ id: oauth2RefreshTokens.id, familyId: oauth2RefreshTokens.familyId });

  return {
    token,
    id: inserted[0]!.id,
    familyId: inserted[0]!.familyId,
    expiresAt,
  }
}

export async function revokeRefreshTokenFamily(familyId: string, clientId: string, userId: string) {
  const now = new Date()

  await db
    .update(oauth2RefreshTokens)
    .set({ revokedAt: now })
    .where(and(eq(oauth2RefreshTokens.familyId, familyId), isNull(oauth2RefreshTokens.revokedAt)));

  // Mark access tokens as revoked from this point forward.
  await db
    .insert(oauth2TokenInvalidations)
    .values({ userId, clientId, invalidatedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [oauth2TokenInvalidations.userId, oauth2TokenInvalidations.clientId],
      set: { invalidatedAt: now, updatedAt: now },
    });
}

export async function rotateRefreshToken(input: {
  clientId: string
  refreshToken: string
  userAgent?: string | null
  ip?: string | null
}) {
  const tokenHash = hashWithPepper(input.refreshToken)
  const now = new Date()

  const existing = await db
    .select()
    .from(oauth2RefreshTokens)
    .where(and(eq(oauth2RefreshTokens.clientId, input.clientId), eq(oauth2RefreshTokens.tokenHash, tokenHash)))
    .limit(1)

  if (existing.length === 0) return { ok: false as const, reason: 'missing' as const }

  const rt = existing[0]

  if (rt.expiresAt.getTime() <= now.getTime()) return { ok: false as const, reason: 'expired' as const }

  if (rt.revokedAt) {
    // Reuse detected: revoke entire family.
    await revokeRefreshTokenFamily(rt.familyId, rt.clientId, rt.userId)
    return { ok: false as const, reason: 'reused' as const }
  }

  const newToken = randomToken(REFRESH_TOKEN_BYTES)
  const newHash = hashWithPepper(newToken)
  const newExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(oauth2RefreshTokens)
      .values({
        familyId: rt.familyId,
        userId: rt.userId,
        clientId: rt.clientId,
        tokenHash: newHash,
        issuedAt: now,
        expiresAt: newExpiresAt,
        userAgent: input.userAgent ?? null,
        ip: input.ip ?? null,
        lastUsedAt: now,
      })
      .returning({ id: oauth2RefreshTokens.id })

    const newId = inserted[0]!.id

    // Revoke old token (rotation)
    const updated = await tx
      .update(oauth2RefreshTokens)
      .set({ revokedAt: now, rotatedToId: newId, lastUsedAt: now })
      .where(and(eq(oauth2RefreshTokens.id, rt.id), isNull(oauth2RefreshTokens.revokedAt)))
      .returning({ id: oauth2RefreshTokens.id })

    if (updated.length === 0) {
      // Another request may have rotated/revoked it concurrently: treat as reuse.
      await revokeRefreshTokenFamily(rt.familyId, rt.clientId, rt.userId)
      return { ok: false as const, reason: 'reused' as const }
    }

    return { ok: true as const, userId: rt.userId, familyId: rt.familyId, refreshToken: newToken }
  })

  return result
}

export async function revokeRefreshTokenByValue(clientId: string, refreshToken: string) {
  const tokenHash = hashWithPepper(refreshToken)
  const existing = await db
    .select()
    .from(oauth2RefreshTokens)
    .where(and(eq(oauth2RefreshTokens.clientId, clientId), eq(oauth2RefreshTokens.tokenHash, tokenHash)))
    .limit(1)

  if (existing.length === 0) return { ok: false as const }
  const rt = existing[0]
  await revokeRefreshTokenFamily(rt.familyId, rt.clientId, rt.userId)
  return { ok: true as const }
}

export async function isAccessTokenInvalidated(input: {
  userId: string
  clientId: string
  issuedAtMs: number
}) {
  const rows = await db
    .select({ invalidatedAt: oauth2TokenInvalidations.invalidatedAt })
    .from(oauth2TokenInvalidations)
    .where(and(eq(oauth2TokenInvalidations.userId, input.userId), eq(oauth2TokenInvalidations.clientId, input.clientId)))
    .limit(1)

  if (rows.length === 0) return false
  return rows[0]!.invalidatedAt.getTime() > input.issuedAtMs
}

export function getAccessToken(accessToken: string) {
  console.log('[getAccessToken] Verifying JWT token, first 20 chars:', accessToken.substring(0, 20));

  const payload = verifyJWT(accessToken);

  if (!payload) {
    console.warn('[getAccessToken] JWT verification failed');
    return null;
  }

  console.log('[getAccessToken] JWT verified successfully');
  console.log('[getAccessToken] ProfileId:', payload.userId);
  console.log('[getAccessToken] Email:', payload.email);
  console.log('[getAccessToken] Role:', payload.role);
  console.log('[getAccessToken] Expires at (unix):', payload.exp);

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    issuedAt: payload.iat * 1000,
    expiresAt: payload.exp * 1000,
    clientId: payload.clientId || 'dojo-app',
  };
}

export function resolveStudentLevel(level: unknown): StudentLevel | null {
  if (typeof level !== 'string') return null;
  if ((STUDENT_LEVELS as readonly string[]).includes(level)) {
    return level as StudentLevel;
  }
  return null;
}

export function normalizeStudentLevel(input: unknown): StudentLevel | null {
  if (input == null) return null;
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toLowerCase().replace(/\s+/g, '_');
  return resolveStudentLevel(normalized);
}

export function mapBeltToExternalRole(beltRank: string | null | undefined): ExternalSystemRole {
  if (!beltRank) return 'student_9th_kyu';
  switch (beltRank.toLowerCase()) {
    case 'white': return 'student_9th_kyu';
    case 'yellow': return 'student_8th_kyu';
    case 'orange': return 'student_7th_kyu';
    case 'green': return 'student_6th_kyu';
    case 'blue': return 'student_5th_kyu';
    case 'purple': return 'student_4th_kyu';
    case 'brown': return 'student_3rd_kyu';
    case 'brown_kyu3': return 'student_3rd_kyu';
    case 'brown_kyu2': return 'student_2nd_kyu';
    case 'brown_kyu1': return 'student_1st_kyu';
    case 'black': return 'black_belt';
    default: return 'student_9th_kyu';
  }
}

export async function resolveExternalRoleBySupabaseUserId(supabaseUserId: string): Promise<{
  profileId: string | null;
  email: string;
  role: ExternalSystemRole | null;
}> {
  const localUser = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.supabaseUserId, supabaseUserId))
    .limit(1);

  if (localUser.length === 0) {
    throw new Error('User not found in local database');
  }

  const localUserId = localUser[0].id;
  const email = localUser[0].email ?? '';

  const linkedProfile = await db
    .select({ id: profiles.id, studentLevel: profiles.studentLevel, beltRank: profiles.beltRank })
    .from(profiles)
    .where(eq(profiles.userId, localUserId))
    .limit(1);

  const profileId = linkedProfile[0]?.id ?? null;

  const userPerms = await getUserPermissionsWithFallback(localUserId);
  const roleNames = userPerms.roles.map((r) => r.name);

  if (roleNames.some((r) => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r))) {
    return { profileId: profileId ?? localUserId, email, role: 'admin' };
  }

  if (roleNames.includes('INSTRUCTOR')) {
    return { profileId: profileId ?? localUserId, email, role: 'teacher' };
  }

  if (roleNames.includes('PARTNER')) {
    return { profileId: profileId ?? localUserId, email, role: 'partner' };
  }

  if (roleNames.some((r) => ['STUDENT', 'MEMBER'].includes(r))) {
    // Check belt rank from the onboarding profile data
    const beltRank = linkedProfile[0]?.beltRank;
    return { profileId, email, role: mapBeltToExternalRole(beltRank) };
  }

  return { profileId: profileId ?? localUserId, email, role: 'none' };
}

export async function resolveExternalRoleByProfileId(profileId: string): Promise<{
  profileId: string
  email: string
  role: ExternalSystemRole | null
}> {
  const linked = await db
    .select({
      profileId: profiles.id,
      userId: profiles.userId,
      beltRank: profiles.beltRank,
      email: user.email,
    })
    .from(profiles)
    .leftJoin(user, eq(profiles.userId, user.id))
    .where(eq(profiles.id, profileId))
    .limit(1)

  if (linked.length === 0) {
    throw new Error('Profile not found in local database')
  }

  const localUserId = linked[0]!.userId
  const email = linked[0]!.email ?? ''

  if (!localUserId) {
    throw new Error('Profile is not linked to a local user')
  }

  const userPerms = await getUserPermissionsWithFallback(localUserId)
  const roleNames = userPerms.roles.map((r) => r.name)

  if (roleNames.some((r) => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r))) {
    return { profileId, email, role: 'admin' }
  }

  if (roleNames.includes('INSTRUCTOR')) {
    return { profileId, email, role: 'teacher' }
  }

  if (roleNames.includes('PARTNER')) {
    return { profileId, email, role: 'partner' }
  }

  if (roleNames.some((r) => ['STUDENT', 'MEMBER'].includes(r))) {
    const beltRank = linked[0]!.beltRank
    return { profileId, email, role: mapBeltToExternalRole(beltRank) }
  }

  return { profileId, email, role: 'none' }
}
