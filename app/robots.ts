import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages personnelles : jamais indexees.
      disallow: ["/mon-acces"],
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
