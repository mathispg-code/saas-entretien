import type { MetadataRoute } from "next";

const BASE_URL = "https://candiview.fr";

const ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/generateur", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/mentions-legales", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/confidentialite", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
