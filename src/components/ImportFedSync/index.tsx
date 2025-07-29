'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ImportOptions {
  skipCategories?: boolean
  skipEvents?: boolean
  skipProfiles?: boolean
  dryRun?: boolean
  batchSize?: number
  concurrency?: number
}

export const ImportFedSync: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false)
  const [lastJobId, setLastJobId] = useState<string | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    skipCategories: false,
    skipEvents: false,
    skipProfiles: false,
    dryRun: false,
    batchSize: 50,
    concurrency: 5
  })

  const handleImport = async () => {
    setIsImporting(true)
    
    try {
      const response = await fetch('/api/import-fedsync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify(options)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setLastJobId(data.jobId)
      toast.success(`Import started successfully! Job ID: ${data.jobId}`)
      toast.info('Import is running in the background. Check the Job Status tab for progress.')
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FedSync Import</CardTitle>
        <CardDescription>
          Configure and start a new import from FedSync API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry-run"
              checked={options.dryRun}
              onCheckedChange={(checked) => 
                setOptions({ ...options, dryRun: checked as boolean })
              }
            />
            <Label htmlFor="dry-run" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Dry Run (preview only, no changes)
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Skip Types</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-categories"
                checked={options.skipCategories}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, skipCategories: checked as boolean })
                }
              />
              <Label htmlFor="skip-categories">Skip Categories</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-events"
                checked={options.skipEvents}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, skipEvents: checked as boolean })
                }
              />
              <Label htmlFor="skip-events">Skip Events</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-profiles"
                checked={options.skipProfiles}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, skipProfiles: checked as boolean })
                }
              />
              <Label htmlFor="skip-profiles">Skip Profiles</Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              value={options.batchSize}
              onChange={(e) => 
                setOptions({ ...options, batchSize: parseInt(e.target.value) || 50 })
              }
              min="1"
              max="500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concurrency">Concurrency</Label>
            <Input
              id="concurrency"
              type="number"
              value={options.concurrency}
              onChange={(e) => 
                setOptions({ ...options, concurrency: parseInt(e.target.value) || 5 })
              }
              min="1"
              max="20"
            />
          </div>
        </div>

        {lastJobId && (
          <div className="text-sm text-muted-foreground">
            Last import job: <code className="text-xs bg-muted px-1 py-0.5 rounded">{lastJobId}</code>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? 'Starting Import...' : 'Start Import'}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Import runs in the background. You can close this page and check status later.
        </p>
      </CardFooter>
    </Card>
  )
}