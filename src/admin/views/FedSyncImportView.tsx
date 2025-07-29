import React from 'react'
import { Gutter } from '@payloadcms/ui'
import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewProps } from 'payload'
import { ImportFedSync } from '@/components/ImportFedSync'

export const FedSyncImportView: React.FC<AdminViewProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '8px',
              margin: 0,
              color: 'var(--theme-text)',
            }}
          >
            FedSync Import
          </h1>
          <p
            style={{
              color: 'var(--theme-text)',
              opacity: 0.7,
              margin: 0,
              fontSize: '14px',
            }}
          >
            Import data from FedSync API into Payload CMS
          </p>
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ImportFedSync />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default FedSyncImportView