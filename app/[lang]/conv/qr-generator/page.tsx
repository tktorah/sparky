import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/src/resources/seo";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { QrGeneratorClient } from "./qr-generator.client";

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
    path: "/conv/qr-generator",
    title: `${dict.qrGenerator.title} | DevTora`,
    description: dict.qrGenerator.subtitle,
  });
}

export default async function QrGeneratorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <QrGeneratorClient dict={dict} />;
}
