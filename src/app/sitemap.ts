import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

const base = getEnv().SITE_URL.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/hoc",
    "/luyen-tap",
    "/thi-thu",
    "/thong-tin-ky-thi",
    "/chinh-sach-rieng-tu",
    "/dieu-khoan",
    "/ghi-cong",
  ];
  return routes.map((route) => ({
    url: `${base}${route === "" ? "" : route}`,
    lastModified: new Date("2026-10-04"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
