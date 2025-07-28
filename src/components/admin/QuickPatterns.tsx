'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'

export const QuickPatterns: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null)

  const quickAdd = async (pattern: string, description: string, role: string = 'authenticated') => {
    setLoading(pattern)
    try {
      const response = await fetch(`/api/allowed-users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern,
          type: pattern.includes('*') ? 'wildcard' : 'exact',
          description,
          defaultRole: role,
        }),
      })

      if (response.ok) {
        toast.success(`Added pattern: ${pattern}`)
        // Refresh the page to show the new pattern
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add pattern')
      }
    } catch (error) {
      toast.error('Failed to add pattern')
      console.error('Error adding pattern:', error)
    } finally {
      setLoading(null)
    }
  }

  const patterns = [
    {
      pattern: '*@milespartnership.com',
      description: 'All Miles Partnership emails',
      role: 'content-editor',
    },
    { pattern: 'erawk26@gmail.com', description: "Erik's GitHub account", role: 'admin' },
    // { pattern: '*@*.milespartnership.com', description: 'All subdomains', role: 'authenticated' },
    // { pattern: 'contractor-*@external.com', description: 'External contractors', role: 'authenticated' },
  ]

  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1rem',
        border: '1px solid #e5e5e5',
        borderRadius: '8px',
      }}
    >
      <h4 style={{ marginBottom: '1rem' }}>Quick Add Common Patterns</h4>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {patterns.map(({ pattern, description, role }) => (
          <Button
            key={pattern}
            onClick={() => quickAdd(pattern, description, role)}
            disabled={loading === pattern}
            size="small"
          >
            {loading === pattern ? 'Adding...' : `Add ${pattern}`}
          </Button>
        ))}
      </div>
    </div>
  )
}
