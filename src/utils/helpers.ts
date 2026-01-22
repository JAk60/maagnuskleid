// utils/helpers.ts

import { Product, FilterState } from "@/lib/types";

// ========================================
// GENDER CONVERSION HELPERS
// ========================================

/**
 * Convert URL gender param to DB gender value
 * URL: "Male" or "Female" → DB: "Male" or "Female"
 */
export function urlGenderToDbGender(
	urlGender: string
): "Male" | "Female" | null {
	const lower = urlGender.toLowerCase();
	if (lower === "male" || lower === "mens") return "Male";
	if (lower === "female" || lower === "womens") return "Female";
	return null;
}

/**
 * Convert DB gender value to URL gender param
 * DB: "Male" or "Female" → URL: "Male" or "Female"
 */
export function dbGenderToUrlGender(dbGender: string): string {
	if (dbGender === "Male") return "Male";
	if (dbGender === "Female") return "Female";
	return dbGender.toLowerCase();
}

/**
 * Convert DB gender to display name
 * DB: "Male" → Display: "Mens"
 * DB: "Female" → Display: "Womens"
 */
export function dbGenderToDisplayName(dbGender: string): string {
	if (dbGender === "Male") return "Mens";
	if (dbGender === "Female") return "Womens";
	return dbGender;
}

// ========================================
// CATEGORY CONVERSION HELPERS
// ========================================

/**
 * Convert URL category slug to DB category format
 * URL: "mens-oversized-tshirt" → DB: "Mens-Oversized_tshirt"
 */
export function urlCategoryToDbCategory(categorySlug: string): string {
	const parts = categorySlug.split("-");

	// Capitalize first part (mens/womens -> Mens/Womens)
	const prefix = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

	// Join remaining parts with underscores and capitalize each word
	const suffix = parts
		.slice(1)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("_");

	return `${prefix}-${suffix}`;
}

/**
 * Convert DB category to display name
 * DB: "Mens-Oversized_tshirt" → Display: "Oversized Tshirt"
 */
export function dbCategoryToDisplayName(dbCategory: string): string {
	return dbCategory
		.replace(/^(Mens|Womens)-/, "") // Remove prefix
		.replace(/_/g, " "); // Replace underscores with spaces
}

// ========================================
// PRODUCT FILTERING BY GENDER
// ========================================

/**
 * Get all products for Male
 */
export function getMenProducts(products: Product[]): Product[] {
	return products.filter((p) => p.gender === "Male");
}

/**
 * Get all products for Female
 */
export function getWomenProducts(products: Product[]): Product[] {
	return products.filter((p) => p.gender === "Female");
}

/**
 * Get products by gender
 */
export function getProductsByGender(
	products: Product[],
	gender: "Male" | "Female"
): Product[] {
	return products.filter((p) => p.gender === gender);
}

/**
 * Get products by gender and category
 */
export function getProductsByGenderAndCategory(
	products: Product[],
	gender: "Male" | "Female",
	category: string
): Product[] {
	return products.filter(
		(p) => p.gender === gender && p.category === category
	);
}

// ========================================
// SLUG GENERATION
// ========================================

// Generate slug from product name
export function generateSlug(name: string): string {
	return name
		?.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Generate category slug
export function generateCategorySlug(category: string): string {
	return category
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Parse category slug back to original format
export function parseCategorySlug(slug: string): {
	gender: string | null;
	category: string;
	isGenderSpecific: boolean;
} {
	// Check if it starts with mens/womens
	if (slug.startsWith("mens-") || slug.startsWith("womens-")) {
		const parts = slug.split("-");
		const genderPrefix = parts[0]; // 'mens' or 'womens'
		const gender = genderPrefix === "mens" ? "Male" : "Female";
		const categoryPart = parts
			.slice(1)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return {
			gender,
			category: `${gender}-${categoryPart}`,
			isGenderSpecific: true,
		};
	} else {
		// Gender-neutral category (e.g., 'jersey', 'sweatpants')
		const categoryPart = slug
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return {
			gender: null,
			category: categoryPart,
			isGenderSpecific: false,
		};
	}
}

// ========================================
// FORMATTING
// ========================================

// Format price
export function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "INR",
	}).format(price);
}

// ========================================
// FILTERING & SORTING
// ========================================



// Sort products
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
					new Date(b.created_at).getTime() -
					new Date(a.created_at).getTime()
			);
		case "name":
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		default:
			return sorted;
	}
}


// Get price range from products
export function getPriceRange(products: Product[]): [number, number] {
	if (products.length === 0) return [0, 100];

	const prices = products.map((p) => p.price);
	return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

// Add slug to product
export function addSlugToProduct(product: Product): Product {
	return {
		...product,
		slug: generateSlug(product.name),
	};
}

// utils/helpers.ts - Add/Update these functions

// Get all unique colors from products (DEDUPLICATED)
export function getAllColors(products: Product[]): (string | { name: string; hex: string })[] {
  const colorMap = new Map<string, string | { name: string; hex: string }>();
  
  products.forEach(product => {
    product.colors?.forEach(color => {
      const colorValue = typeof color === 'string' 
        ? color 
        : ((color as { name?: string; hex?: string }).name || (color as { name?: string; hex?: string }).hex);
      
      // Use the color value as key to prevent duplicates
      if (colorValue && !colorMap.has(colorValue)) {
        colorMap.set(colorValue, color);
      }
    });
  });
  
  return Array.from(colorMap.values());
}

// Helper to extract category name from slug
export function extractCategoryFromSlug(slug: string): string {
  // "mens-jersey" → "Jersey"
  // "womens-baby-tees" → "Baby Tees"
  // "womens-oversized-tshirt" → "Oversized T-Shirt"
  
  console.log('🔍 EXTRACTING CATEGORY FROM SLUG:', slug);
  
  // Remove "mens-" or "womens-" prefix
  const withoutPrefix = slug.replace(/^(mens|womens)-/, '');
  console.log('  After removing prefix:', withoutPrefix);
  
  // Special cases for known category formats - CHECK YOUR DATABASE!
  const specialCases: Record<string, string> = {
    'baby-tees': 'Baby Tees',
    'oversized-tshirt': 'Oversized T-Shirt',
    'oversized-t-shirt': 'Oversized T-Shirt',
    'flared-pants': 'Flared Pants',
    'sweatshirt': 'Sweatshirt',
    'sweatshirts': 'Sweatshirts',
    'sweatpants': 'Sweatpants',
    'jersey': 'Jersey',
    'jerseys': 'Jerseys',
    'shirts': 'Shirts',
    'shirt': 'Shirt',
  };
  
  if (specialCases[withoutPrefix]) {
    console.log('  ✅ Found special case mapping:', specialCases[withoutPrefix]);
    return specialCases[withoutPrefix];
  }
  
  // Default: Convert slug to title case with proper spacing
  const titleCase = withoutPrefix
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  console.log('  ⚠️ Using title case conversion:', titleCase);
  return titleCase;
}

// Enhanced filter function with better debugging
export function filterProducts(products: Product[], filters: FilterState): Product[] {
  return products.filter(product => {
    // Gender filter
    if (filters.gender.length > 0 && !filters.gender.includes(product.gender)) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(product.category)) {
        return false;
      }
    }

    // Price filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Size filter
    if (filters.sizes.length > 0) {
      const hasMatchingSize = filters.sizes.some(size => product.sizes.includes(size));
      if (!hasMatchingSize) {
        return false;
      }
    }

    // Color filter
    if (filters.colors.length > 0) {
      const productColors = product.colors.map(color => 
        typeof color === 'string' 
          ? color 
          : ((color as { name?: string; hex?: string }).name || (color as { name?: string; hex?: string }).hex)
      );
      const hasMatchingColor = filters.colors.some(filterColor => 
        productColors.includes(filterColor)
      );
      if (!hasMatchingColor) {
        return false;
      }
    }

    // Stock filter
    if (filters.inStock && product.stock === 0) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}