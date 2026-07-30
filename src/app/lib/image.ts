import { BACKEND_ORIGIN } from "./api";

export function resolveImageUrl(imageUrl?: string | null, fallback = "/foods/food1.jpg") {
  if (!imageUrl) return fallback;

  let normalized = imageUrl.trim();

  if (normalized.includes(",http")) {
    const parts = normalized.split(",");
    normalized = parts[parts.length - 1] || normalized;
  }

  // If image URL starts with /uploads/, prepend backend origin
  // so it loads from the Go backend, not from the frontend (Vercel)
  if (normalized.startsWith("/uploads/")) {
    const origin = BACKEND_ORIGIN || "";
    if (origin && !origin.startsWith("/")) {
      return `${origin}${normalized}`;
    }
  }

  // Replace localhost backend URLs with actual backend origin
  if (typeof window !== "undefined") {
    normalized = normalized.replace(/^https?:\/\/localhost:(3000|4000)\b/i, () => {
      const origin = BACKEND_ORIGIN || "";
      return origin && !origin.startsWith("/") ? origin : window.location.origin;
    });
  }

  return normalized || fallback;
}
