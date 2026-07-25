// 이 루트 레이아웃은 Next.js가 요구하는 최상위 레이아웃입니다.
// 실제 <html>, <body>, metadata는 app/[lang]/layout.tsx에서 관리합니다.
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/src/resources/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DevTora — Developer Tools",
  description: "Online tools for developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        {/* hydration 전에 실행되어 깜빡임 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var theme = localStorage.getItem('darkTheme');
                if (theme === 'false') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `,
          }}
        />
        {children}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7745297103052326"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
