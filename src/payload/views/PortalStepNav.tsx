'use client'

import React from 'react'
import { SetStepNav } from '@payloadcms/ui'

type Props = {
  label: string
}

export default function PortalStepNav({ label }: Props) {
  return <SetStepNav nav={[{ label }]} />
}
