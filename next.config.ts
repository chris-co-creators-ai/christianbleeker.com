import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [new URL("https://i.ytimg.com/vi/ZAmHKw7I4YM/maxresdefault.jpg")],
  },
};

export default nextConfig;
