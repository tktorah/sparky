import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { buildPageMetadata } from "@/src/resources/seo";
import { HomePage } from "./home.client";

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
    path: "/conv/home",
    title: dict.metadata.title,
    description: dict.metadata.description,
  });
}

export default async function HomePageRoute({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <HomePage dict={dict} />;
}
