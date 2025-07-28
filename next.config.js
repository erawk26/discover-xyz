import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3026'
const hostnames = [
  NEXT_PUBLIC_SERVER_URL,
  'http://localhost:3026',
  'assets.simpleviewinc.com',
  'media-cdn.tripadvisor.com',
  'res.cloudinary.com',
  '*.cloudfront.net',
]
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...hostnames.map((item) => {
        const url = new URL(item.startsWith('http') ? item : `https://${item}`)
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
          port: url.port || '',
          pathname: '/**',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
