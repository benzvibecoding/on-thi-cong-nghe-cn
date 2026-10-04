import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/domain/exam-config";

const base = (APP_CONFIG.siteUrl || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
