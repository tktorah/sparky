import type { MetadataRoute } from "next";
import { getDictionary, locales, defaultLocale } from "@/app/[lang]/dictionaries";
import { SITE_URL } from "@/src/resources/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dict = await getDictionary(defaultLocale);
  const toolPaths = dict.tools.map((tool) => tool.href.replace(`/${defaultLocale}`, ""));
  const paths = ["/conv/home", ...toolPaths];

  return paths.map((path) => {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      languages[locale] = `${SITE_URL}/${locale}${path}`;
    }

    return {
      url: `${SITE_URL}/${defaultLocale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: path === "/conv/home" ? 1 : 0.8,
      alternates: { languages },
    };
  });
}
