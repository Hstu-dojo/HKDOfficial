import { Suspense } from 'react'
import MonthlyBilling from './MonthlyBilling.client'

export default function MonthlyBillingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading billing...</p>}>
      <MonthlyBilling />
    </Suspense>
  )
}
