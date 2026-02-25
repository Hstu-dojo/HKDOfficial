import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import React from 'react'
import PendingStudentsViewClient from './PendingStudentsView.client'

export default async function PendingStudentsView(props: AdminViewServerProps) {
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
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <PendingStudentsViewClient />
    </DefaultTemplate>
  )
}
