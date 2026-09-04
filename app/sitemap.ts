import type { MetadataRoute } from "next";
import { siteUrl } from "./site-url";

const publicSiteUrl = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: publicSiteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${publicSiteUrl}/log`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];
}
