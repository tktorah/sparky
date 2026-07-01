import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { UrlEncoderClient } from "./url-encoder.client";

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
