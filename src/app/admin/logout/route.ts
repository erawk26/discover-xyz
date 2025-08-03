import { redirect } from 'next/navigation'

export async function GET() {
  // Redirect to the unified logout route
  redirect('/logout')
}

export async function POST() {
  // Also handle POST requests
  redirect('/logout')
}