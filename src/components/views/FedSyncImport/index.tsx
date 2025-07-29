'use client'

import React from 'react'
import { ImportFedSync } from '../../ImportFedSync'
import { ImportJobStatus } from '../../ImportFedSync/JobStatus'

export const FedSyncImportContent: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ImportFedSync />
      <ImportJobStatus />
    </div>
  )
}

export default FedSyncImportContent