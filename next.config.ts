import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Externalize pdfjs-dist from server bundling to avoid worker chunk issues
  // This makes Node.js require() it at runtime instead of bundling it
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
