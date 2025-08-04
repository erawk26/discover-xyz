import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * API endpoint to detect the current theme preference
 * This allows the Better Auth login page to match Payload's theme
 */
export async function GET(request: NextRequest) {
  try {
    // Check for theme in cookies (if set by Payload admin)
    const cookieStore = await cookies()
    const payloadTheme = cookieStore.get('payload-theme')
    
    if (payloadTheme?.value && (payloadTheme.value === 'dark' || payloadTheme.value === 'light')) {
      return NextResponse.json({ theme: payloadTheme.value })
    }
    
    // Check for theme preference in headers (from client-side localStorage)
    const clientTheme = request.headers.get('x-theme-preference')
    if (clientTheme && (clientTheme === 'dark' || clientTheme === 'light')) {
      return NextResponse.json({ theme: clientTheme })
    }
    
    // Default to light theme
    return NextResponse.json({ theme: 'light' })
  } catch (error) {
    console.error('Error detecting theme:', error)
    return NextResponse.json({ theme: 'light' })
  }
}