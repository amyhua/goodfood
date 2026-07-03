import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/app-url";

/** robots.txt (F7): public marketing/tool pages are crawlable; APIs and per-user pages are not. */
export default function robots(): MetadataRoute.Robots {
  const base = appBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/plans", "/login", "/signup"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
