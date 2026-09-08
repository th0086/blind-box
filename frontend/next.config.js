/** @type {import('next').NextConfig} */
const spacesPublicBaseUrl = process.env.DO_SPACES_PUBLIC_BASE_URL || 'https://weedza-storage.sgp1.digitaloceanspaces.com';
const spacesHostname = new URL(spacesPublicBaseUrl).hostname;

const nextConfig = {
  reactStrictMode: true,
  // Keep dev artifacts isolated from production build artifacts.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: spacesHostname,
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid filesystem cache corruption when folders are cleaned during active dev sessions.
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
