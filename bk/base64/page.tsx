import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { Base64Converter } from "./base64.client";

export default async function Base64Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return <Base64Converter dict={dict} />;
}
