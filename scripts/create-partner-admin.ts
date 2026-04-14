#!/usr/bin/env tsx

// Create Partner Admin (bootstrap)
// @ts-ignore
import 'dotenv/config'

import { db } from '../src/lib/connect-db'
import { partners, partnerAdmins } from '../src/db/schema'
import { eq, sql } from 'drizzle-orm'
import { hash } from '../src/lib/hash'

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function requireArg(flag: string): string {
  const value = getArgValue(flag)
  if (!value) {
    throw new Error(`Missing required arg: ${flag}`)
  }
  return value
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    process.exit(1)
  }

  const email = requireArg('--email').trim().toLowerCase()
  const password = requireArg('--password')
  const nameArg = getArgValue('--name')
  const name = nameArg?.trim()

  const upsert = hasFlag('--upsert')
  const forcePartner = hasFlag('--forcePartner')

  const partnerSlug = getArgValue('--partnerSlug')?.trim()
  const partnerIdArg = getArgValue('--partnerId')?.trim()

  if (!partnerSlug && !partnerIdArg) {
    throw new Error('Provide either --partnerSlug or --partnerId')
  }

  const [partner] = await db
    .select({ id: partners.id, slug: partners.slug, name: partners.name })
    .from(partners)
    .where(partnerSlug ? eq(partners.slug, partnerSlug) : eq(partners.id, partnerIdArg!))
    .limit(1)

  if (!partner) {
    throw new Error('Partner not found')
  }

  const passwordHash = await hash(password)

  const [existing] = await db
    .select({
      id: partnerAdmins.id,
      partnerId: partnerAdmins.partnerId,
      email: partnerAdmins.email,
      name: partnerAdmins.name,
    })
    .from(partnerAdmins)
    .where(sql`lower(${partnerAdmins.email}) = ${email}`)
    .limit(1)

  if (existing) {
    if (!upsert) {
      throw new Error(
        'Partner admin already exists for this email. Re-run with --upsert to reset the password.'
      )
    }

    if (existing.partnerId !== partner.id && !forcePartner) {
      throw new Error(
        'Partner admin exists but is linked to a different partner. Re-run with --forcePartner to reassign, or use the correct --partnerSlug/--partnerId.'
      )
    }

    const [updated] = await db
      .update(partnerAdmins)
      .set({
        passwordHash,
        name: name || existing.name,
        isActive: true,
        partnerId: forcePartner ? partner.id : existing.partnerId,
        updatedAt: new Date(),
      })
      .where(eq(partnerAdmins.id, existing.id))
      .returning({ id: partnerAdmins.id, email: partnerAdmins.email, partnerId: partnerAdmins.partnerId })

    console.log('Updated partner admin:', {
      id: updated?.id,
      email: updated?.email,
      partnerId: updated?.partnerId,
      partnerSlug: partner.slug,
      partnerName: partner.name,
    })
    return
  }

  if (!name) {
    throw new Error('Missing required arg: --name (required when creating a new partner admin)')
  }

  const [created] = await db
    .insert(partnerAdmins)
    .values({
      partnerId: partner.id,
      email,
      passwordHash,
      name,
      isActive: true,
    })
    .returning({ id: partnerAdmins.id, email: partnerAdmins.email, partnerId: partnerAdmins.partnerId })

  console.log('Created partner admin:', {
    id: created?.id,
    email: created?.email,
    partnerId: created?.partnerId,
    partnerSlug: partner.slug,
    partnerName: partner.name,
  })
}

main().catch((err) => {
  console.error('[create-partner-admin] Failed:', err)
  process.exitCode = 1
})
