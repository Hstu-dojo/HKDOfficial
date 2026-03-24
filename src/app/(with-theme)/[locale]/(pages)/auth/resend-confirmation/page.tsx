'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
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
        toast.error(result.error || 'Failed to resend confirmation email')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Resend Confirmation Email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address to receive a new confirmation link
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Resend Confirmation Email'}
          </Button>
        </form>

        <div className="text-center">
          <Link 
            href="/login" 
            className="text-sm text-muted-foreground hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}