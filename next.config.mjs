/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/asaf',
        destination: '/telaviv2026/asaf',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
