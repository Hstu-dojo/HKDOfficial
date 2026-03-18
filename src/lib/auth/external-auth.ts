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
const accessTokenStore = new Map<string, AccessTokenContext>();

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
  const token = crypto.randomBytes(48).toString('hex');
  const issuedAt = Date.now();
  accessTokenStore.set(token, {
    ...input,
    issuedAt,
    expiresAt: issuedAt + ACCESS_TOKEN_TTL_MS,
  });
  return {
    token,
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
  const token = accessTokenStore.get(accessToken);
  if (!token) return null;
  if (Date.now() >= token.expiresAt) {
    accessTokenStore.delete(accessToken);
    return null;
  }
  return token;
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
