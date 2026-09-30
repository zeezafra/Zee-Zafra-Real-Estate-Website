import type { MetadataRoute } from "next";
import { getAreas, getPosts, getProperties } from "@/lib/api";
import { SITE_URL } from "@/lib/siteConfig";
import { slugify } from "@/lib/slug";

// Static marketing routes plus every AVAILABLE property detail page.
// getProperties() already scopes to status=AVAILABLE (see lib/api.ts) and
// nothing under /admin belongs in a public sitemap, so both stay out
// without any extra filtering here.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: "daily", priority: 0.9 },
    // Phase 15
    { url: `${SITE_URL}/areas`, changeFrequency: "weekly", priority: 0.7 },
    // Phase 16
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sell`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/testimonials`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sold`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/guides`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const properties = await getProperties();
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${SITE_URL}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Phase 15: one entry per neighborhood landing page, same source as
  // generateStaticParams() in app/(public)/areas/[slug]/page.tsx.
  const areas = await getAreas();
  const areaRoutes: MetadataRoute.Sitemap = areas.map((area) => ({
    url: `${SITE_URL}/areas/${slugify(area.location)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Phase 16: one entry per published post, same source as
  // generateStaticParams() in app/(public)/blog/[slug]/page.tsx.
  const posts = await getPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...propertyRoutes, ...areaRoutes, ...postRoutes];
}
