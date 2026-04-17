/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serve public/index.html as the root page. Next.js still handles /api/*
  // routes normally — only "/" is rewritten to the static app.
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
    ]
  },
}

module.exports = nextConfig
