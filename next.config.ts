import type { NextConfig } from "next";

// Ram Hub is a client-driven demo (simulated live data + localStorage), so the
// cacheComponents / partial prefetching defaults from the scaffold are turned off.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
