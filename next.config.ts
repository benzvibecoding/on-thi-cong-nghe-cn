import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Personal/app pages must not be indexed.
      ...[
        "/on-tap",
        "/thong-ke",
        "/cai-dat",
        "/tim-kiem",
        "/studio",
        "/thi-thu/lam-bai",
      ].flatMap((base) => [
        { source: base, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
        {
          source: `${base}/:path*`,
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ]),
      {
        // Service worker must not be cached aggressively.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
