// src/components/products/FilterSidebar.tsx
// FilterSidebar now receives CategoryObj[] so it can filter by category_id (UUID)
// instead of by category name string.

"use client";

import { FilterState, CategoryObj } from "@/lib/types";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableColors: (string | { name: string; hex: string })[];
  priceRange: [number, number];
  onReset: () => void;
  // Now CategoryObj[] instead of string[]
  availableCategories?: CategoryObj[];
}

export default function FilterSidebar({
  filters,
  onChange,
  availableColors,
  priceRange,
  onReset,
  availableCategories = [],
}: FilterSidebarProps) {
  const toggleCategory = (categoryId: string) => {
    const current = filters.categories;
    const updated = current.includes(categoryId)
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId];
    onChange({ ...filters, categories: updated });
  };

  const toggleGender = (gender: string) => {
    const current = filters.gender;
    const updated = current.includes(gender)
      ? current.filter((g) => g !== gender)
      : [...current, gender];
    onChange({ ...filters, gender: updated });
  };

  const toggleSize = (size: string) => {
    const current = filters.sizes;
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onChange({ ...filters, sizes: updated });
  };

  const toggleColor = (colorKey: string) => {
    const current = filters.colors;
    const updated = current.includes(colorKey)
      ? current.filter((c) => c !== colorKey)
      : [...current, colorKey];
    onChange({ ...filters, colors: updated });
  };

  const getColorKey = (color: string | { name: string; hex: string }): string =>
    typeof color === "string" ? color : color.name;

  const getColorHex = (color: string | { name: string; hex: string }): string =>
    typeof color === "string"
      ? color.toLowerCase() === "white"
        ? "#ffffff"
        : color.toLowerCase()
      : color.hex;

  const getColorName = (color: string | { name: string; hex: string }): string =>
    typeof color === "string" ? color : color.name;

  const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

  const hasActiveFilters =
    filters.gender.length > 0 ||
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.inStock ||
    filters.priceRange[0] > priceRange[0] ||
    filters.priceRange[1] < priceRange[1];

  return (
    <div className="space-y-6">
      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="w-full text-sm text-red-600 hover:text-red-700 font-medium text-left"
        >
          Clear all filters
        </button>
      )}

      {/* Gender */}
      <div>
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-700">
          Gender
        </h3>
        <div className="space-y-2">
          {["Male", "Female"].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.gender.includes(g)}
                onChange={() => toggleGender(g)}
                className="w-4 h-4 accent-gray-900"
              />
              <span className="text-sm">{g === "Male" ? "Mens" : "Womens"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories — only shown when categories are available */}
      {availableCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-700">
            Category
          </h3>
          <div className="space-y-2">
            {availableCategories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 accent-gray-900"
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-700">
          Price
        </h3>
        <div className="space-y-3">
          <input
            type="range"
            min={priceRange[0]}
            max={priceRange[1]}
            value={filters.priceRange[1]}
            onChange={(e) =>
              onChange({
                ...filters,
                priceRange: [filters.priceRange[0], Number(e.target.value)],
              })
            }
            className="w-full accent-gray-900"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{filters.priceRange[0].toLocaleString("en-IN")}</span>
            <span>₹{filters.priceRange[1].toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-700">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {commonSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-all ${
                filters.sizes.includes(size)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 hover:border-gray-900"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-700">
            Color
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const key = getColorKey(color);
              const hex = getColorHex(color);
              const name = getColorName(color);
              const isSelected = filters.colors.includes(key);

              return (
                <button
                  key={key}
                  onClick={() => toggleColor(key)}
                  title={name}
                  className={`flex items-center gap-1.5 px-2 py-1.5 text-xs border rounded-lg transition-all ${
                    isSelected
                      ? "border-gray-900 ring-1 ring-gray-900"
                      : "border-gray-300 hover:border-gray-900"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* In stock */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="w-4 h-4 accent-gray-900"
          />
          <span className="text-sm font-medium">In stock only</span>
        </label>
      </div>
    </div>
  );
}