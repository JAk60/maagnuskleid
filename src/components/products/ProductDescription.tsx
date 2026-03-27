// components/products/ProductDescription.tsx

import { parseDescription } from "@/utils/parseDescription";
import { cleanSpecs } from "@/utils/cleanSpecs";

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const { prose, material, specs, bullets } = parseDescription(description);

  const cleanedSpecs = cleanSpecs(material, specs);

  // 🔥 combine material + specs into one clean list
  const keywords = [
    ...(material ? [material] : []),
    ...cleanedSpecs,
  ];

  return (
    <div className="space-y-4">
      {/* Prose intro */}
      {prose && (
        <p className="text-sm text-gray-600 leading-relaxed">{prose}</p>
      )}

      {/* 🔥 Keywords line (NO badges) */}
      {keywords.length > 0 && (
        <p className="text-sm text-gray-800 font-medium">
          {keywords.join(" • ")}
        </p>
      )}

      {/* Bullet details */}
      {bullets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Product Details
          </p>
          <ul className="space-y-2">
            {bullets.map((bullet, i) => (
              <li
                key={`bullet-${i}`}
                className="flex items-start gap-2.5 text-sm text-gray-700"
              >
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}