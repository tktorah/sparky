import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/src/resources/seo";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { SqlFormatterClient } from "./sql-formatter.client";

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
    path: "/conv/sql-formatter",
    title: `${dict.sqlFormatter.title} | DevTora`,
    description: dict.sqlFormatter.subtitle,
  });
}

export default async function SqlFormatterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <SqlFormatterClient dict={dict} />;
}
