import type { ReactNode } from "react";
import { cookies } from "next/headers";
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

  // Read from a cookie (not localStorage) so the server can render the
  // sidebar at its correct width up front. Navigation in this app is a full
  // page load, so relying on client-only storage would flash the sidebar
  // open before JS could collapse it again.
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebarCollapsed")?.value === "true";

  return (
    <>
      <ConvLayoutClient lang={lang} dict={dict} initialCollapsed={initialCollapsed}>
        {children}
      </ConvLayoutClient>
    </>
  );
}
