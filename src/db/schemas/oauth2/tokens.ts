import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// OAuth2 Authorization Codes (PKCE)
export const oauth2AuthorizationCodes = pgTable(
  'oauth2_authorization_codes',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    codeHash: text('code_hash').notNull(),
    clientId: text('client_id').notNull(),
    redirectUri: text('redirect_uri').notNull(),
    scope: text('scope').notNull().default(''),
    userId: text('user_id').notNull(),
    codeChallenge: text('code_challenge').notNull(),
    codeChallengeMethod: text('code_challenge_method').notNull().default('S256'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeHashIdx: uniqueIndex('oauth2_auth_code_hash_idx').on(table.codeHash),
  })
)

// OAuth2 Refresh Tokens (hashed, rotating)
export const oauth2RefreshTokens = pgTable(
  'oauth2_refresh_tokens',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    clientId: text('client_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    rotatedToId: text('rotated_to_id'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex('oauth2_refresh_token_hash_idx').on(table.clientId, table.tokenHash),
    familyIdx: index('oauth2_refresh_token_family_idx').on(table.familyId),
  })
)

// Access token invalidation marker (for logout / refresh-family theft detection)
// If invalidatedAt is after token iat => token is considered revoked.
export const oauth2TokenInvalidations = pgTable(
  'oauth2_token_invalidations',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id').notNull(),
    clientId: text('client_id').notNull(),
    invalidatedAt: timestamp('invalidated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userClientIdx: uniqueIndex('oauth2_token_invalidations_user_client_idx').on(
      table.userId,
      table.clientId
    ),
  })
)

export type OAuth2AuthorizationCode = typeof oauth2AuthorizationCodes.$inferSelect
export type NewOAuth2AuthorizationCode = typeof oauth2AuthorizationCodes.$inferInsert

export type OAuth2RefreshToken = typeof oauth2RefreshTokens.$inferSelect
export type NewOAuth2RefreshToken = typeof oauth2RefreshTokens.$inferInsert

export type OAuth2TokenInvalidation = typeof oauth2TokenInvalidations.$inferSelect
export type NewOAuth2TokenInvalidation = typeof oauth2TokenInvalidations.$inferInsert
