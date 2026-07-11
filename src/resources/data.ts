import type { Dictionary } from "@/app/[lang]/dictionaries";

// ToolItem 타입은 딕셔너리의 tools 배열 아이템과 동일
export type ToolItem = Dictionary["tools"][number];

export type IconName =
  | "binary"
  | "braces"
  | "case"
  | "clock"
  | "code"
  | "database"
  | "file"
  | "fingerprint"
  | "hash"
  | "home"
  | "key"
  | "link"
  | "lock"
  | "palette"
  | "qr"
  | "searchCode"
  | "split"
  | "sparky"
  | "type";
