'use client'

import React from 'react'

/** Small icon shown in the Payload admin nav bar (replaces the default Payload CMS icon). */
export default function Icon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="HKD"
      style={{ height: 24, width: 'auto' }}
    />
  )
}
