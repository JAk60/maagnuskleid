import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		unoptimized: true, // Add this line
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cdn.maagnuskleid.com",
				port: "",
				pathname: "/**",
			},
		],
		formats: ["image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200],
		imageSizes: [16, 32, 48, 64, 96, 128, 256],
		minimumCacheTTL: 31536000,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
