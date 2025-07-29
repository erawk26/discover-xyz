'use client'

import React from 'react'
import Link from 'next/link'
import { NavGroup } from '@payloadcms/ui'

export const CustomNavLinks: React.FC = () => {
  return (
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
  )
}

export default CustomNavLinks