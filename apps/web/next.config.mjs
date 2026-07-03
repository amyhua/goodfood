/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@goodfood/domain", "@goodfood/db", "@goodfood/api-client", "@goodfood/usda"],
};
export default nextConfig;
