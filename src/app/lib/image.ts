export function resolveImageUrl(imageUrl?: string | null, fallback = "/foods/food1.jpg") {
  if (!imageUrl) return fallback;

  let normalized = imageUrl.trim();

  if (normalized.includes(",http")) {
    const parts = normalized.split(",");
    normalized = parts[parts.length - 1] || normalized;
  }

  if (typeof window !== "undefined") {
    normalized = normalized.replace(/^https?:\/\/localhost:(3000|4000)\b/i, (match) => {
      return match.includes(":4000") ? "http://localhost:4000" : window.location.origin;
    });
  }

  return normalized || fallback;
}
