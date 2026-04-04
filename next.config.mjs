/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
  },
  images: {
    domains: ["localhost", "res.cloudinary.com"],
  },
};

export default nextConfig;