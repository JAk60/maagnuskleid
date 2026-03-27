// utils/parseDescription.ts

export interface ParsedDescription {
  prose: string;
  material: string | null;
  specs: string[];
  bullets: string[];
}

const DETAILS_SPLIT_RE =
  /\b(?:product\s+)?(?:details?|fabric details?|material details?|specs?|composition|product info)\s*[:\-–—|]+\s*/i;

const SPEC_KEYWORD_RE =
  /\b(lightweight|breathable|stretchable|stretch|imported|moisture[\s-]?wicking|quick[\s-]?dry|anti[\s-]?bacterial|gsm|denier|luxury[\s-]?grade|premium|machine[\s-]?wash|hand[\s-]?wash|polyester|cotton|nylon|spandex|elastane|linen|wool|viscose|rayon|fleece|jersey|terry|twill|satin|blend)\b/i;

const FILLER_RE =
  /\b(fabric|material|the|and|or|for|in|of|a|an|is|are|with|its|this|that|from|by|as)\b/gi;

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n")
    .trim();
}

function mergeBrokenCaps(text: string): string {
  // Merge lines like:
  // "EUROPEAN\nPOLYESTER fabric" → "EUROPEAN POLYESTER fabric"
  return text.replace(/([A-Z]{2,})\s*\n\s*([A-Z]{2,})/g, "$1 $2");
}

export function parseDescription(raw: string): ParsedDescription {
  if (!raw) return { prose: "", material: null, specs: [], bullets: [] };

  const clean = normalizeText(raw);

  // 1. Split prose vs details
  const splitMatch = clean.match(DETAILS_SPLIT_RE);

  let proseBlock = clean;
  let detailsBlock = "";

  if (splitMatch?.index !== undefined) {
    proseBlock = clean.slice(0, splitMatch.index).trim();
    detailsBlock = clean
      .slice(splitMatch.index + splitMatch[0].length)
      .trim();
  }

  detailsBlock = mergeBrokenCaps(detailsBlock);

  // 2. Extract bullets (• OR fallback: line-based)
  const bullets: string[] = [];

  const bulletRe = /[•*]\s*([^\n•*]+)/g;
  let m: RegExpExecArray | null;

  while ((m = bulletRe.exec(detailsBlock)) !== null) {
    const b = m[1].trim();
    if (b) bullets.push(b);
  }

  // fallback → treat each line as bullet if no symbols
  if (bullets.length === 0) {
    const lines = detailsBlock
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    bullets.push(...lines);
  }

  // 3. Spec header = first line
  const specHeaderLine = bullets[0] || "";

  // 4. Extract ALL CAPS sequences
  const capsMatches =
    specHeaderLine.match(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g) ?? [];

  const capsFiltered = capsMatches.filter(
    (c) => !/^(GSM|UV|IS|BIS|PH|THE|AND|OR|FOR|IN|OF|A)$/.test(c)
  );

  // ✅ improved material detection (multi-word)
  const material =
    capsFiltered.length > 0
      ? toTitleCase(capsFiltered.join(" "))
      : null;

  // 5. Parenthesis specs
  const parenSpecs =
    (specHeaderLine.match(/\(([^)]+)\)/g) ?? []).map((s) =>
      s.replace(/[()]/g, "").trim()
    );

  // 6. Inline specs cleanup
  const strippedHeader = specHeaderLine
    .replace(/\([^)]*\)/g, "")
    .replace(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g, "")
    .replace(FILLER_RE, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const inlineSpecs = strippedHeader
    .split(/,\s*|\s*\|\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && SPEC_KEYWORD_RE.test(p))
    .map(toTitleCase);

  // 7. Extract specs from all bullets (NEW 🔥)
  const bulletSpecs = bullets
    .flatMap((b) =>
      b
        .split(/,|\|/)
        .map((s) => s.trim())
        .filter((s) => SPEC_KEYWORD_RE.test(s))
    )
    .map(toTitleCase);

  const specs = [
    ...new Set([...parenSpecs, ...inlineSpecs, ...bulletSpecs]),
  ];

  return {
    prose: proseBlock,
    material,
    specs,
    bullets,
  };
}