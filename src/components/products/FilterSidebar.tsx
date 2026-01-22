// components/products/FilterSidebar.tsx - FINAL VERSION

'use client';

import { FilterState, ALL_SIZES } from '@/lib/types';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableColors: (string | { name: string; hex: string })[];
  priceRange: [number, number];
  onReset: () => void;
  availableCategories?: string[]; // NEW: Optional prop for dynamic categories
}

// Helper function to get color hex value
const getColorHex = (color: string | { name?: string; hex: string }): string => {
  if (typeof color === 'string') {
    // Old format: string color
    return color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase();
  } else if (color && typeof color === 'object' && color.hex) {
    // New format: {name, hex}
    return color.hex;
  }
  return '#000000'; // fallback
};

export default function FilterSidebar({
  filters,
  onChange,
  availableColors,
  priceRange,
  onReset,
  availableCategories // NEW
}: FilterSidebarProps) {

  const handleGenderChange = (gender: string) => {
    const newGenders = filters.gender.includes(gender)
      ? filters.gender.filter(g => g !== gender)
      : [...filters.gender, gender];
    onChange({ ...filters, gender: newGenders, categories: [] });
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: newCategories });
  };

  const handleSizeChange = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes: newSizes });
  };

  const handleColorChange = (color: string | { name: string; hex: string }) => {
    const colorValue = typeof color === 'string' ? color : color.name || color.hex;
    const newColors = filters.colors.includes(colorValue)
      ? filters.colors.filter(c => c !== colorValue)
      : [...filters.colors, colorValue];
    onChange({ ...filters, colors: newColors });
  };

  const hasActiveFilters =
    filters.gender.length > 0 ||
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.inStock ||
    filters.priceRange[0] !== priceRange[0] ||
    filters.priceRange[1] !== priceRange[1];

  return (
    <div className="bg-[#E3D9C6] w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Gender Filter - Only show if not pre-filtered */}
      {(!filters.gender.length || filters.gender.length < 2) && (
        <div className="border-b pb-6">
          <h3 className="font-medium mb-3">Gender</h3>
          <div className="space-y-2">
            {['Male', 'Female'].map(gender => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.gender.includes(gender)}
                  onChange={() => handleGenderChange(gender)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">{gender === 'Male' ? 'Mens' : 'Womens'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter - Use dynamic categories if provided */}
      {availableCategories && availableCategories.length > 0 && (
        <div className="border-b pb-6">
          <h3 className="font-medium mb-3">Category</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="space-y-3">
          <input
            type="range"
            min={priceRange[0]}
            max={priceRange[1]}
            value={filters.priceRange[1]}
            onChange={(e) => onChange({
              ...filters,
              priceRange: [priceRange[0], Number(e.target.value)]
            })}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map(size => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${filters.sizes.includes(size)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-[#E3D9C6] text-gray-900 border-gray-300 hover:border-gray-900'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div className="border-b pb-6">
        <h3 className="font-medium mb-3">Colors</h3>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color, idx) => {
            const colorValue = typeof color === 'string' ? color : color.name || color.hex;
            const colorHex = getColorHex(color);
            
            return (
              <button
                key={`color-${colorValue}-${idx}`}
                onClick={() => handleColorChange(color)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${filters.colors.includes(colorValue)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-[#E3D9C6] text-gray-900 border-gray-300 hover:border-gray-900'
                  }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: colorHex }}
                />
                {colorValue}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm">In stock only</span>
        </label>
      </div>
    </div>
  );
}