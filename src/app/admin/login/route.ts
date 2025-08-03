import { redirect } from 'next/navigation'

export async function GET() {
  // Redirect admin login to the unified sign-in page
  redirect('/sign-in?redirectTo=/admin')
}

export async function POST() {
  // Also handle POST requests (in case of form submissions)
  redirect('/sign-in?redirectTo=/admin')
}