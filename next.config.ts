import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/projects/:id",
        destination: "/project-details/:id",
        permanent: false,
      },
      {
        source: "/projects/:id/review",
        destination: "/project/:id/review",
        permanent: false,
      },
      {
        source: "/projects/:id/sample-routing",
        destination: "/project/:id/sample-routing",
        permanent: false,
      },
      {
        source: "/projects/:id/survey-setup",
        destination: "/project/:id/survey-setup",
        permanent: false,
      },
      {
        source: "/projects/:id/price",
        destination: "/project/:id/price",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
