// lib/types.ts

export interface SizeChartEntry {
	size: string;
	chest?: number;
	waist?: number;
	hips?: number;
	length?: number;
	shoulder?: number;
	sleeve?: number;
	[key: string]: string | number | undefined;
}


// Add this new interface above Product
export interface ProductImage {
  id: string;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  size_chart: SizeChartEntry[];
  has_size_chart: boolean;
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: ProductImage[];  // ← was string[], now the real shape
  category: string;
  sizes: string[];
  colors: (string | { name?: string; hex: string })[];  // ← fix this too, your card already handles both but the type said string[]
  stock: number;
  created_at: string;
  updated_at?: string;
  gender: "Male" | "Female";
  slug?: string;
  // extras from real data
  category_id?: number | null;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  sku?: string;
}
export interface FilterState {
	gender: string[];
	categories: string[];
	priceRange: [number, number];
	sizes: string[];
	colors: string[];
	inStock: boolean;
	searchQuery: string;
	sortBy: "price-asc" | "price-desc" | "newest" | "name";
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
};

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];