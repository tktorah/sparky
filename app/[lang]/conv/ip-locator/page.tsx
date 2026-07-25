import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/src/resources/seo";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { IpLocatorClient } from "./ip-locator.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const dict = await getDictionary(lang);

  return buildPageMetadata({
    lang,
    path: "/conv/ip-locator",
    title: `${dict.ipLocator.title} | DevTora`,
    description: dict.ipLocator.subtitle,
  });
}

export default async function IpLocatorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <IpLocatorClient dict={dict} />;
}
