import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?error=${error}`, request.url))
  }
  
  // Better Auth should handle the callback, but if we get here, redirect to admin
  return NextResponse.redirect(new URL('/admin', request.url))
}