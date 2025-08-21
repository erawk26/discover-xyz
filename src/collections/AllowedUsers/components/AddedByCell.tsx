'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

export const AddedByCell: React.FC<any> = (props) => {
  // In Payload v3, the cell component receives the entire row data
  const rowData = props?.cellData || props?.rowData || props
  
  // Debug logging
  console.log('AddedByCell props:', props)
  
  // Try to get user information in order of preference
  if (rowData?.addedBy?.value?.email || rowData?.addedBy?.email) {
    const user = rowData.addedBy?.value || rowData.addedBy
    return <span>{user.name || user.email}</span>
  }
  
  if (rowData?.addedByEmail) {
    return <span>{rowData.addedByEmail}</span>
  }
  
  if (rowData?.addedVia === 'sso') {
    return <span style={{ opacity: 0.7 }}>SSO Auto-created</span>
  }
  
  if (rowData?.addedVia === 'system') {
    return <span style={{ opacity: 0.7 }}>System</span>
  }
  
  if (rowData?.addedVia === 'import') {
    return <span style={{ opacity: 0.7 }}>System Import</span>
  }
  
  return <span style={{ opacity: 0.7 }}>Unknown</span>
}

export const AddedByField: React.FC = () => {
  const { value: addedBy } = useField({ path: 'addedBy' }) as { value: any }
  const { value: addedByEmail } = useField({ path: 'addedByEmail' }) as { value: string }
  const { value: addedVia } = useField({ path: 'addedVia' }) as { value: string }
  
  if (addedBy?.email) {
    return <div>{addedBy.name || addedBy.email}</div>
  }
  
  if (addedByEmail) {
    return <div>{addedByEmail}</div>
  }
  
  const viaLabels = {
    sso: 'SSO Auto-created',
    system: 'System',
    import: 'Imported',
    admin: 'Admin Panel',
  }
  
  return <div className="text-muted-foreground">{viaLabels[addedVia as keyof typeof viaLabels] || 'Unknown'}</div>
}