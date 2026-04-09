/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
  images: {
    domains: ["localhost", "res.cloudinary.com"],
  },
};

export default nextConfig;
