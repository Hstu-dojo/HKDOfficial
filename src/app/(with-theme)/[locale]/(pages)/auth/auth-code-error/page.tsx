'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCurrentLocale, useScopedI18n } from '@/locales/client'

export default function AuthCodeErrorPage() {
  const t = useScopedI18n('auth.authCodeError')
  const locale = useCurrentLocale()

  const [errorDetails, setErrorDetails] = useState<{
    error?: string
    error_description?: string
    error_code?: string
  }>({})

  const searchParams = useSearchParams()

  useEffect(() => {
    // Get error details from URL hash or search params
    const error = searchParams?.get('error') || window.location.hash.match(/error=([^&]*)/)?.[1]
    const error_description = searchParams?.get('error_description') || 
      decodeURIComponent(window.location.hash.match(/error_description=([^&]*)/)?.[1] || '')
    const error_code = searchParams?.get('error_code') || window.location.hash.match(/error_code=([^&]*)/)?.[1]

    setErrorDetails({ error, error_description, error_code })
  }, [searchParams])

  const getErrorMessage = () => {
    if (errorDetails.error_code === 'otp_expired') {
      return t('messages.otpExpired')
    }
    if (errorDetails.error === 'access_denied') {
      return t('messages.accessDenied')
    }
    if (errorDetails.error === 'no_code') {
      return t('messages.noCode')
    }
    if (errorDetails.error_description) {
      return errorDetails.error_description
    }
    if (errorDetails.error) {
      return t('messages.errorWithCode', { error: errorDetails.error })
    }
    return t('messages.default')
  }

  const getErrorTitle = () => {
    if (errorDetails.error_code === 'otp_expired') {
      return t('titles.otpExpired')
    }
    if (errorDetails.error === 'no_code') {
      return t('titles.noCode')
    }
    return t('titles.default')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg text-center">
        <div>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{getErrorTitle()}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-3">
          {errorDetails.error_code === 'otp_expired' && (
            <Link href={`/${locale}/auth/resend-confirmation`}>
              <Button className="w-full">
                {t('actions.requestNewVerificationEmail')}
              </Button>
            </Link>
          )}
          
          <Link href={`/${locale}/login`}>
            <Button variant="outline" className="w-full">
              {t('actions.backToLogin')}
            </Button>
          </Link>
          
          <Link href={`/${locale}`}>
            <Button variant="ghost" className="w-full">
              {t('actions.goToHome')}
            </Button>
          </Link>
        </div>

        {errorDetails.error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              {t('technicalDetailsTitle')}
            </summary>
            <div className="mt-2 text-xs text-gray-400 font-mono">
              <p>{t('technical.errorLabel')} {errorDetails.error}</p>
              {errorDetails.error_code && <p>{t('technical.codeLabel')} {errorDetails.error_code}</p>}
              {errorDetails.error_description && (
                <p>{t('technical.descriptionLabel')} {errorDetails.error_description}</p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}