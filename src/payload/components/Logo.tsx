'use client'

import React from 'react'

/** Custom logo rendered on the Payload admin login page (replaces the default Payload CMS logo). */
export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="HKD"
        style={{ height: 80, width: 'auto' }}
      />
    </div>
  )
}
