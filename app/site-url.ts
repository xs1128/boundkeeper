export const DEFAULT_SITE_URL = "https://genai-hack-amber.vercel.app";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}
