import { redirect } from "next/navigation";

// /conv/home → Proxy가 자동으로 /[lang]/conv/home으로 리다이렉트합니다.
// 이 파일은 Proxy 우회 시의 fallback입니다.
export default function LegacyHomePage() {
  redirect("/en/conv/home");
}
