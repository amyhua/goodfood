import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/app-url";

/** sitemap.xml (F7): the stable public surfaces. Per-user (/plans) and unguessable share
 *  pages (/s/[slug]) are intentionally excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appBaseUrl();
  const routes = ["/", "/planner", "/foods", "/pantry", "/shopping"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
