import { NextRequest } from 'next/server'
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors'
import { handleOAuth2Introspect } from '@/lib/oauth2/introspect-handler'

export async function POST(request: NextRequest) {
  const response = await handleOAuth2Introspect(request)
  return withExternalAuthCors(request, response)
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request)
}
