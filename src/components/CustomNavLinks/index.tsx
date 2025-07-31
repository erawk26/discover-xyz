'use client'

import React from 'react'
import Link from 'next/link'
import { NavGroup } from '@payloadcms/ui'
import { LogoutButton } from '@/components/LogoutButton'

export const CustomNavLinks: React.FC = () => {
  return (
    <>
      <NavGroup label="FedSync">
        <Link 
          href="/admin/fedsync-import"
          style={{
            display: 'block',
            padding: '8px 16px',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          FedSync Import
        </Link>
        <Link 
          href="/admin/import-job-status"
          style={{
            display: 'block',
            padding: '8px 16px',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          Import Job Status
        </Link>
      </NavGroup>
      <div style={{ padding: '16px', borderTop: '1px solid var(--theme-elevation-100)' }}>
        <LogoutButton />
      </div>
    </>
  )
}

export default CustomNavLinks