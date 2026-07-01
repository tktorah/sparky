import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { MarkdownClient } from "./markdown.client";

export default async function MarkdownPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <MarkdownClient dict={dict} />;
}
