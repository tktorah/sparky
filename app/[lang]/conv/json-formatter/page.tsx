import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { JsonFormatterClient } from "./json-formatter.client";

export default async function JsonFormatterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <JsonFormatterClient dict={dict} />;
}
