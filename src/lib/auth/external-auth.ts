import crypto from 'crypto';
import { db } from '@/lib/connect-db';
import { user, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export const EXTERNAL_SYSTEM_ROLES = ['admin', 'teacher', 'partner', ...STUDENT_LEVELS] as const;
export type ExternalSystemRole = (typeof EXTERNAL_SYSTEM_ROLES)[number];

type OAuthCodeContext = {
  clientId: string;
  redirectUri: string;
  userId: string;
  role: ExternalSystemRole;
  email: string;
  codeChallenge: string;
  state: string;
  createdAt: number;
  expiresAt: number;
};

type RefreshTokenContext = {
  userId: string;
  role: ExternalSystemRole;
  email: string;
  issuedAt: number;
};

type AccessTokenContext = {
  userId: string;
  role: ExternalSystemRole;
  email: string;
  issuedAt: number;
  expiresAt: number;
  clientId: string;
};

const AUTH_CODE_TTL_MS = 180 * 1000;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

const oauthCodeStore = new Map<string, OAuthCodeContext>();
const usedAuthorizationCodes = new Set<string>();
const refreshTokenStore = new Map<string, RefreshTokenContext>();

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

function signJWT(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

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

export function isRegisteredClient(clientId: string) {
  return getRegisteredClients().includes(clientId);
}

export function createAuthorizationCode(payload: Omit<OAuthCodeContext, 'createdAt' | 'expiresAt'>) {
  const code = crypto.randomBytes(32).toString('hex');
  const createdAt = Date.now();
  oauthCodeStore.set(code, {
    ...payload,
    createdAt,
    expiresAt: createdAt + AUTH_CODE_TTL_MS,
  });
  return code;
}

export function getAuthorizationCodeContext(code: string):
  | { ok: true; context: OAuthCodeContext }
  | { ok: false; reason: 'missing' | 'reused' | 'expired' } {
  if (usedAuthorizationCodes.has(code)) {
    return { ok: false, reason: 'reused' };
  }

  const ctx = oauthCodeStore.get(code);
  if (!ctx) {
    return { ok: false, reason: 'missing' };
  }

  if (Date.now() > ctx.expiresAt) {
    oauthCodeStore.delete(code);
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, context: ctx };
}

export function invalidateAuthorizationCode(code: string) {
  oauthCodeStore.delete(code);
  usedAuthorizationCodes.add(code);
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
  const jwt = signJWT({
    sub: input.userId, // subject = profile ID
    userId: input.userId, // also include as userId for convenience
    email: input.email,
    role: input.role,
  });

  console.log('[createAccessToken] New JWT token issued');
  console.log('[createAccessToken] Token first 20 chars:', jwt.substring(0, 20));
  console.log('[createAccessToken] ProfileId:', input.userId);
  console.log('[createAccessToken] Email:', input.email);
  console.log('[createAccessToken] Role:', input.role);
  console.log('[createAccessToken] ClientId:', input.clientId);
  console.log('[createAccessToken] Token is stateless (no store needed)');

  return {
    token: jwt,
    expiresIn: 3600,
  };
}

export function createRefreshToken(input: Omit<RefreshTokenContext, 'issuedAt'>) {
  const token = crypto.randomBytes(48).toString('hex');
  refreshTokenStore.set(token, {
    ...input,
    issuedAt: Date.now(),
  });
  return token;
}

export function getRefreshToken(refreshToken: string) {
  return refreshTokenStore.get(refreshToken) ?? null;
}

export function revokeRefreshToken(refreshToken: string) {
  refreshTokenStore.delete(refreshToken);
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
    clientId: 'dojo-app', // JWT doesn't store clientId, but we can default to registered client
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
    .select({ id: profiles.id, studentLevel: profiles.studentLevel })
    .from(profiles)
    .where(eq(profiles.userId, localUserId))
    .limit(1);

  const profileId = linkedProfile[0]?.id ?? null;

  const userPerms = await getUserPermissionsWithFallback(localUserId);
  const roleNames = userPerms.roles.map((r) => r.name);

  if (roleNames.some((r) => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r))) {
    return { profileId, email, role: 'admin' };
  }

  if (roleNames.includes('INSTRUCTOR')) {
    return { profileId, email, role: 'teacher' };
  }

  if (roleNames.includes('PARTNER')) {
    return { profileId, email, role: 'partner' };
  }

  if (roleNames.some((r) => ['STUDENT', 'MEMBER'].includes(r))) {
    const studentLevel = resolveStudentLevel(linkedProfile[0]?.studentLevel);
    return { profileId, email, role: studentLevel };
  }

  return { profileId, email, role: null };
}
