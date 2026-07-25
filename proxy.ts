import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ja", "ko"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "en";

/**
 * Accept-Language 헤더에서 선호 언어를 감지합니다.
 */
function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") ?? "";

  // 저장된 언어 선택 확인 (쿠키)
  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (savedLocale && (locales as readonly string[]).includes(savedLocale)) {
    return savedLocale as Locale;
  }

  // Accept-Language 헤더 파싱
  const segments = acceptLanguage
    .split(",")
    .map((seg) => seg.split(";")[0].trim().toLowerCase());

  for (const seg of segments) {
    // 완전 일치 (예: "ja", "ko", "en")
    if ((locales as readonly string[]).includes(seg)) {
      return seg as Locale;
    }
    // 언어 코드만 일치 (예: "ja-JP" → "ja")
    const lang = seg.split("-")[0];
    if ((locales as readonly string[]).includes(lang)) {
      return lang as Locale;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로케일 단독 경로 (예: "/ko", "/ko/")인 경우 /ko/conv/home으로 리다이렉트
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/conv/home`;
      return NextResponse.redirect(url);
    }
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`)
  );
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  if (pathname === "/") {
    url.pathname = `/${locale}/conv/home`;
  } else {
    url.pathname = `/${locale}${pathname}`;
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 경로에 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, sitemap.xml, robots.txt
     * - og (동적 Open Graph 이미지 생성 라우트, 로케일 prefix 불필요)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|og).*)",
  ],
};
