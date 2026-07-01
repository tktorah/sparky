import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { ConvLayoutClient } from "./layout.client";

export default async function ConvLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);

  return (
    <>
      <ConvLayoutClient lang={lang} dict={dict}>
        {children}
      </ConvLayoutClient>
    </>
  );
}
