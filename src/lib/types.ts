// lib/types.ts

/* =========================
   SIZE CHART
========================= */
export interface SizeChartEntry {
  id?: string;
  product_id?: number;
  size: string;
  chest?: number;
  length?: number;
  bust?: number;
  length_female?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Allow extra dynamic fields safely
  [key: string]: string | number | undefined;
}

/* =========================
   PRODUCT IMAGES
========================= */
export interface ProductImage {
  id: string;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

/* =========================
   CATEGORY TYPES
========================= */
export interface CategoryObj {
  id: string;
  name: string;
  slug: string;
  gender: "Male" | "Female" | "Unisex";
}

export interface Category {
  name: string;
  slug: string;
  gender: "Male" | "Female";
  count?: number;
}

export const CATEGORIES = {
  Male: ["Oversized tshirt", "Jersey", "Sweatshirt", "Shirts", "Sweatpants"],
  Female: [
    "Baby tees",
    "Jersey",
    "Oversized tshirt",
    "Shirts",
    "Sweatshirts",
    "Sweatpants",
    "Flared pants",
  ],
} as const;

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

/* =========================
   PRODUCT
========================= */
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;

  // Primary image (legacy)
  image_url: string | null;

  // Legacy text category (DO NOT USE for filtering)
  category: string;

  // FK to categories table (USE THIS)
  category_id: string | null;

  // Joined category object
  category_obj?: CategoryObj | null;

  sizes: string[];

  // Support both string and structured color
  colors: (string | { name: string; hex: string })[];

  stock: number;
  gender: string;

  created_at: string;
  updated_at?: string;

  // Multiple images support
  images?: (string | { image_url: string })[];

  slug?: string;

  // Size chart
  has_size_chart?: boolean;
  size_chart?: SizeChartEntry[];

  // Shipping / logistics
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;

  sku?: string;
}

/* =========================
   FILTER STATE
========================= */
export interface FilterState {
  gender: string[];

  // IMPORTANT: stores category_id (UUID), not name
  categories: string[];

  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  searchQuery: string;

  sortBy: "newest" | "price-asc" | "price-desc" | "name";
}