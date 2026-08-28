export function isQaEnabled(search?: string): boolean {
  const source =
    search ?? (typeof window === "undefined" ? "" : window.location.search);
  return new URLSearchParams(source).get("qa") === "1";
}
