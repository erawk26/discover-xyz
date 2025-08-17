// Ultra-minimal endpoint - no imports at all
export function GET() {
  return new Response('OK - ' + new Date().toISOString())
}