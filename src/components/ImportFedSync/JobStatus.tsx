'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportJob {
  jobId: string
  status: 'pending' | 'syncing' | 'running' | 'completed' | 'failed'
  phase?: 'initializing' | 'syncing' | 'importing' | 'done'
  startTime: string
  syncStartTime?: string
  syncEndTime?: string
  syncDuration?: string
  importStartTime?: string
  importDuration?: string
  totalDuration?: string
  endTime?: string
  stats?: {
    categories: { processed: number; imported: number; errors: number }
    events: { processed: number; imported: number; errors: number }
    profiles: { processed: number; imported: number; errors: number }
  }
  error?: string
  logFile?: string
}

export const ImportJobStatus: React.FC = () => {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<ImportJob | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/import-fedsync/status', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error: any) {
      toast.error(`Failed to fetch jobs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobDetails = async (jobId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/import-fedsync/status?jobId=${jobId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }
      
      const data = await response.json()
      setJobDetails(data)
      setSelectedJob(jobId)
    } catch (error: any) {
      toast.error(`Failed to fetch job details: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, phase?: string) => {
    const statusStyles = {
      pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      syncing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    
    const displayText = status === 'syncing' ? 'SYNCING' : 
                       status === 'running' && phase === 'importing' ? 'IMPORTING' :
                       status.toUpperCase()
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {displayText}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Job Status</CardTitle>
        <CardDescription>
          View and monitor import job progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={fetchJobs}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Loading...' : 'Refresh Jobs'}
        </Button>

        {jobs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            No import jobs found. Click &quot;Refresh Jobs&quot; to check.
          </p>
        )}

        {jobs.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Recent Jobs</h4>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left text-sm font-medium">Job ID</th>
                    <th className="p-2 text-left text-sm font-medium">Status</th>
                    <th className="p-2 text-left text-sm font-medium">Started</th>
                    <th className="p-2 text-left text-sm font-medium">Duration</th>
                    <th className="p-2 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.jobId} className="border-b">
                      <td className="p-2">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {job.jobId}
                        </code>
                      </td>
                      <td className="p-2">{getStatusBadge(job.status, job.phase)}</td>
                      <td className="p-2 text-sm">{formatDate(job.startTime)}</td>
                      <td className="p-2 text-sm">{calculateDuration(job.startTime, job.endTime)}</td>
                      <td className="p-2">
                        <Button
                          onClick={() => fetchJobDetails(job.jobId)}
                          variant="ghost"
                          size="sm"
                          disabled={loading}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedJob && jobDetails && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Job Details: {selectedJob}</CardTitle>
                <Button
                  onClick={() => {
                    setSelectedJob(null)
                    setJobDetails(null)
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(jobDetails.status, jobDetails.phase)}
                </div>
                <div>
                  <span className="font-medium">Total Duration:</span> {jobDetails.totalDuration || calculateDuration(jobDetails.startTime, jobDetails.endTime)}
                </div>
                <div>
                  <span className="font-medium">Started:</span> {formatDate(jobDetails.startTime)}
                </div>
                {jobDetails.endTime && (
                  <div>
                    <span className="font-medium">Ended:</span> {formatDate(jobDetails.endTime)}
                  </div>
                )}
                {jobDetails.syncDuration && (
                  <div>
                    <span className="font-medium">Sync Duration:</span> {jobDetails.syncDuration}
                  </div>
                )}
                {jobDetails.importDuration && (
                  <div>
                    <span className="font-medium">Import Duration:</span> {jobDetails.importDuration}
                  </div>
                )}
              </div>
              
              {jobDetails.error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Error:</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{jobDetails.error}</p>
                </div>
              )}
              
              {jobDetails.stats && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Import Statistics</h5>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm font-medium">Type</th>
                          <th className="p-2 text-center text-sm font-medium">Processed</th>
                          <th className="p-2 text-center text-sm font-medium">Imported</th>
                          <th className="p-2 text-center text-sm font-medium">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 text-sm">Categories</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.categories.processed}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.categories.imported}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.categories.errors}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 text-sm">Events</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.events.processed}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.events.imported}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.events.errors}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-sm">Profiles</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.profiles.processed}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.profiles.imported}</td>
                          <td className="p-2 text-center text-sm">{jobDetails.stats.profiles.errors}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {jobDetails.logFile && (
                <div className="text-sm">
                  <span className="font-medium">Log File:</span>{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{jobDetails.logFile}</code>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}