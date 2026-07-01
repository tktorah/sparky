import { redirect } from "next/navigation";

// Proxy(proxy.ts)가 언어 감지 후 /[lang]/conv/home으로 리다이렉트합니다.
// 이 컴포넌트는 Proxy를 우회하는 경우를 위한 fallback입니다.
export default function Home() {
  redirect("/en/conv/home");
}
