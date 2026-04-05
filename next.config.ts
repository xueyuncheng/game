import type { NextConfig } from "next";

const isPagesDeployment = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  ...(isPagesDeployment && {
    basePath: "/game",
    assetPrefix: "/game/",
  }),
};

export default nextConfig;
