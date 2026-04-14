#!/usr/bin/env tsx

// Create Partner Admin (bootstrap)
// @ts-ignore
import 'dotenv/config'

import { db } from '../src/lib/connect-db'
import { partners, partnerAdmins } from '../src/db/schema'
import { eq } from 'drizzle-orm'
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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    process.exit(1)
  }

  const email = requireArg('--email').trim().toLowerCase()
  const password = requireArg('--password')
  const name = requireArg('--name')

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

  const [created] = await db
    .insert(partnerAdmins)
    .values({
      partnerId: partner.id,
      email,
      passwordHash,
      name,
      isActive: true,
    })
    .returning({ id: partnerAdmins.id, email: partnerAdmins.email })

  console.log('Created partner admin:', {
    id: created?.id,
    email: created?.email,
    partnerId: partner.id,
    partnerSlug: partner.slug,
    partnerName: partner.name,
  })
}

main().catch((err) => {
  console.error('[create-partner-admin] Failed:', err)
  process.exitCode = 1
})
