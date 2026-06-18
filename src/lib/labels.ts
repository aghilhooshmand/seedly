export type Locale = "en" | "fa";

export function label(
  locale: Locale,
  en: string,
  fa?: string | null,
): string {
  if (locale === "fa" && fa) return fa;
  return en;
}

export function dir(locale: Locale): "ltr" | "rtl" {
  return locale === "fa" ? "rtl" : "ltr";
}
