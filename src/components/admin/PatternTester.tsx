'use client'

import React, { useState } from 'react'
import { Button, TextInput } from '@payloadcms/ui'
import { matchesPattern } from '@/utils/email-matcher'

const PatternTester: React.FC = () => {
  const [testEmail, setTestEmail] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testPatterns = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/allowed-users?limit=1000`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      console.log('API Response:', data)
      
      const docs = data.docs || []
      console.log('Patterns found:', docs.length)

      const matches = docs.filter((pattern: any) => {
        if (pattern.type === 'exact') {
          return pattern.pattern.toLowerCase() === testEmail.toLowerCase()
        }
        return matchesPattern(testEmail, pattern.pattern)
      })

      setResults(matches)
    } catch (error) {
      console.error('Error testing patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
      <h4 style={{ marginBottom: '1rem' }}>Test Email Against Patterns</h4>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <TextInput
            path="testEmail"
            label="Test Email"
            value={testEmail}
            onChange={(e: any) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        <Button onClick={testPatterns} disabled={!testEmail || loading}>
          {loading ? 'Testing...' : 'Test'}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Matches:</strong>
          <ul style={{ marginTop: '0.5rem' }}>
            {results.map((match) => (
              <li key={match.id} style={{ marginBottom: '0.25rem' }}>
                <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>
                  {match.pattern}
                </code>
                {' '}({match.type})
                {match.description && ` - ${match.description}`}
                {' '}- Role: <strong>{match.defaultRole}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {results.length === 0 && testEmail && !loading && (
        <p style={{ marginTop: '1rem', color: '#dc2626' }}>
          No matching patterns found - this email would be denied access
        </p>
      )}
    </div>
  )
}

export default PatternTester