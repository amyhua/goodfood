/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@goodfood/domain", "@goodfood/db", "@goodfood/api-client"],
};
export default nextConfig;
