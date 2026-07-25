import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/src/resources/seo";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { UrlEncoderClient } from "./url-encoder.client";

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
    path: "/conv/url-encoder",
    title: `${dict.urlEncoder.title} | DevTora`,
    description: dict.urlEncoder.subtitle,
  });
}

export default async function UrlEncoderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <UrlEncoderClient dict={dict} />;
}
