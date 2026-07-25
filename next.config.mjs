/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-4e0da5167b73428c8f43c54f8376882d.r2.dev',
      },
    ],
  },
};

export default nextConfig;
