import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

const base = getEnv().SITE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
