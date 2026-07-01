"use client";

// 이 레이아웃은 레거시 /conv/* 경로를 위한 passthrough입니다.
// 실제 레이아웃은 app/[lang]/conv/layout.tsx에 있습니다.
// Proxy(proxy.ts)가 /conv/* → /[lang]/conv/*로 자동 리다이렉트합니다.
import { ReactNode } from "react";

export default function LegacyConvLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
