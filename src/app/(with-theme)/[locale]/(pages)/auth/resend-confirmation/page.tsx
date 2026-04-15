'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCurrentLocale, useI18n } from '@/locales/client'

export default function ResendConfirmationPage() {
  const t = useI18n()
  const locale = useCurrentLocale()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error(t('auth.resendConfirmation.validationEmailRequired'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setEmail('')
      } else {
        toast.error(result.error || t('auth.resendConfirmation.failedResend'))
      }
    } catch (error) {
      toast.error(t('auth.resendConfirmation.somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('auth.resendConfirmation.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.resendConfirmation.subtitle')}
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('auth.resendConfirmation.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.resendConfirmation.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.resendConfirmation.sending') : t('auth.resendConfirmation.button')}
          </Button>
        </form>

        <div className="text-center">
          <Link 
            href={`/${locale}/login`} 
            className="text-sm text-muted-foreground hover:underline"
          >
            {t('auth.resendConfirmation.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}