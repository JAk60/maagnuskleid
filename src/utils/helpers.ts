// utils/helpers.ts

import { Product, FilterState } from "@/lib/types";

// ========================================
// GENDER CONVERSION HELPERS
// ========================================

export function urlGenderToDbGender(urlGender: string): "Male" | "Female" | null {
  const lower = urlGender.toLowerCase();
  if (lower === "male" || lower === "mens") return "Male";
  if (lower === "female" || lower === "womens") return "Female";
  return null;
}

export function dbGenderToUrlGender(dbGender: string): string {
  if (dbGender === "Male") return "Male";
  if (dbGender === "Female") return "Female";
  return dbGender.toLowerCase();
}

export function dbGenderToDisplayName(dbGender: string): string {
  if (dbGender === "Male") return "Mens";
  if (dbGender === "Female") return "Womens";
  return dbGender;
}

// ========================================
// SLUG GENERATION
// ========================================

export function generateSlug(name: string): string {
  return name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Add slug to product (for the product detail URL, based on product name)
export function addSlugToProduct(product: Product): Product {
  return {
    ...product,
    slug: generateSlug(product.name),
  };
}

// ========================================
// PRODUCT FILTERING BY GENDER
// ========================================

export function getMenProducts(products: Product[]): Product[] {
  return products.filter((p) => p.gender === "Male");
}

export function getWomenProducts(products: Product[]): Product[] {
  return products.filter((p) => p.gender === "Female");
}

export function getProductsByGender(
  products: Product[],
  gender: "Male" | "Female"
): Product[] {
  return products.filter((p) => p.gender === gender);
}

export function getProductsByGenderAndCategory(
  products: Product[],
  gender: "Male" | "Female",
  categoryId: string
): Product[] {
  return products.filter(
    (p) => p.gender === gender && p.category_id === categoryId
  );
}

// ========================================
// FORMATTING
// ========================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

// ========================================
// FILTERING & SORTING
// ========================================

export function sortProducts(
  products: Product[],
  sortBy: FilterState["sortBy"]
): Product[] {
  const sorted = [...products];
  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export function getPriceRange(products: Product[]): [number, number] {
  if (products.length === 0) return [0, 10000];
  const prices = products.map((p) => p.price);
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

// ========================================
// COLOR HELPERS
// ========================================

export function getAllColors(
  products: Product[]
): (string | { name: string; hex: string })[] {
  const colorMap = new Map<string, string | { name: string; hex: string }>();

  products.forEach((product) => {
    product.colors?.forEach((color) => {
      if (typeof color === "string") {
        if (!colorMap.has(color)) colorMap.set(color, color);
      } else {
        const key = color.name ?? color.hex;
        if (key && !colorMap.has(key)) {
          colorMap.set(key, { name: color.name ?? color.hex, hex: color.hex });
        }
      }
    });
  });

  return Array.from(colorMap.values());
}

// ========================================
// FILTER PRODUCTS
// ========================================

export function filterProducts(
  products: Product[],
  filters: FilterState
): Product[] {
  return products.filter((product) => {
    // Gender filter
    if (
      filters.gender.length > 0 &&
      !filters.gender.includes(product.gender)
    ) {
      return false;
    }

    // Category filter — now filters by category_id
    if (filters.categories.length > 0) {
      if (!product.category_id || !filters.categories.includes(product.category_id)) {
        return false;
      }
    }

    // Price filter
    if (
      product.price < filters.priceRange[0] ||
      product.price > filters.priceRange[1]
    ) {
      return false;
    }

    // Size filter
    if (filters.sizes.length > 0) {
      const hasMatchingSize = filters.sizes.some((size) =>
        product.sizes.includes(size)
      );
      if (!hasMatchingSize) return false;
    }

    // Color filter
    if (filters.colors.length > 0) {
      const productColors = product.colors.map((color) =>
        typeof color === "string"
          ? color
          : (color as { name?: string; hex?: string }).name ||
            (color as { name?: string; hex?: string }).hex
      );
      const hasMatchingColor = filters.colors.some((filterColor) =>
        productColors.includes(filterColor)
      );
      if (!hasMatchingColor) return false;
    }

    // Stock filter
    if (filters.inStock && product.stock === 0) return false;

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category_obj?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    return true;
  });
}