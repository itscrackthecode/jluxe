import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow local development and HMR when accessed via custom hostnames on port 3000
  allowedDevOrigins: [
    'admin.thejluxe.com',
    'thejluxe.com',
    '*.thejluxe.com',
  ],
  experimental: {
    serverActions: {
      // Allow Server Actions submitted from the admin subdomain.
      // Next.js 16 checks the Origin header against the app's own host and
      // rejects actions whose origin differs. Without this entry, actions
      // fired from admin.thejluxe.com would be rejected with 403.
      allowedOrigins: ['admin.thejluxe.com'],
    },
  },
};

export default nextConfig;