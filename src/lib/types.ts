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


export interface Product {
	size_chart: SizeChartEntry[];
	has_size_chart: boolean;
	id: number;
	name: string;
	description: string;
	price: number;
	image_url: string;
	images?: string[]; // For future multiple images support
	category: string;
	sizes: string[];
	colors: string[];
	stock: number;
	created_at: string;
	gender: "Male" | "Female";
	slug?: string; // Generated from name
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