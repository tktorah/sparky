import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/src/resources/seo";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { EpochConverterClient } from "./epoch-converter.client";

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
    path: "/conv/epoch-converter",
    title: `${dict.epochConverter.title} | DevTora`,
    description: dict.epochConverter.subtitle,
  });
}

export default async function EpochConverterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <EpochConverterClient dict={dict} />;
}
