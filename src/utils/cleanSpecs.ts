// utils/cleanSpecs.ts

export function cleanSpecs(
  material: string | null,
  specs: string[]
): string[] {
  if (!specs) return [];

  const normalized = specs
    .flatMap((spec) => splitSpecs(spec)) // 🔥 break long phrases
    .map(normalizeSpec)
    .filter(Boolean);

  return [...new Set(
    normalized.filter((s) => {
      // ❌ remove material words from specs
      if (!material) return true;

      const mat = material.toLowerCase();
      return !mat.includes(s.toLowerCase());
    })
  )];
}

// 🔥 split phrases like:
// "Imported European Polyester Fabric"
// → ["Imported", "Polyester"]
function splitSpecs(spec: string): string[] {
  return spec
    .split(/,|\||\band\b/i)
    .map((s) => s.trim());
}

// 🔥 normalize wording
function normalizeSpec(spec: string): string {
  const s = spec.toLowerCase();

  if (s.includes("imported")) return "Imported";
  if (s.includes("lightweight")) return "Lightweight";
  if (s.includes("breathable")) return "Breathable";
  if (s.includes("luxury")) return "Luxury-grade Finish";
  if (s.includes("moisture")) return "Moisture-wicking";
  if (s.includes("quick dry")) return "Quick-dry";

  // ❌ remove useless words
  if (
    s === "fabric" ||
    s === "material" ||
    s.length < 3
  ) return "";

  // default
  return spec
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}