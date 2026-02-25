import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import React from 'react'
import BillsViewClient from './BillsView.client'

export default async function BillsView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { permissions, req, visibleEntities, locale } = initPageResult

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <BillsViewClient />
    </DefaultTemplate>
  )
}
