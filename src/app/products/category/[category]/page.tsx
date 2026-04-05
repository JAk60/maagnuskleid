// src/app/products/category/[category]/page.tsx
// [category] param is the category SLUG from the DB (e.g. "jersey", "baby-tees")
// No string manipulation — looks up category by slug directly from DB

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product, FilterState, CategoryObj } from "@/lib/types";
import { getProducts } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import {
  filterProducts,
  sortProducts,
  getAllColors,
  getPriceRange,
  addSlugToProduct,
  dbGenderToDisplayName,
} from "@/utils/helpers";
import ProductCard from "@/components/products/ProductCard";
import FilterSidebar from "@/components/products/FilterSidebar";
import SearchBar from "@/components/SearchBar";
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;

  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<CategoryObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    categories: [],
    priceRange: [0, 10000],
    sizes: [],
    colors: [],
    inStock: false,
    searchQuery: "",
    sortBy: "newest",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Look up category by slug directly — no string transformation needed
        const { data: cat, error: catError } = await supabase
          .from("categories")
          .select("id, name, slug, gender")
          .eq("slug", categorySlug)
          .eq("is_active", true)
          .maybeSingle();

        if (catError) throw catError;

        if (!cat) {
          console.error(`No active category found for slug: "${categorySlug}"`);
          router.push("/products");
          return;
        }

        setCategory(cat as CategoryObj);

        // Fetch all products and filter by category_id
        const products = await getProducts();
        const productsWithSlugs = products.map(addSlugToProduct);

        // For Unisex categories: show all genders
        // For Male/Female categories: filter by that gender too
        const filtered =
          cat.gender === "Unisex"
            ? productsWithSlugs.filter((p) => p.category_id === cat.id)
            : productsWithSlugs.filter(
                (p) =>
                  p.category_id === cat.id && p.gender === cat.gender
              );

        setCategoryProducts(filtered);

        const range =
          filtered.length > 0 ? getPriceRange(filtered) : [0, 10000];

        setFilters((prev) => ({
          ...prev,
          priceRange: range as [number, number],
          // Pre-select gender filter only for gendered categories
          gender: cat.gender !== "Unisex" ? [cat.gender] : [],
          categories: [cat.id],
        }));
      } catch (error) {
        console.error("Error fetching category page:", error);
        router.push("/products");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [categorySlug, router]);

  const priceRange =
    categoryProducts.length > 0 ? getPriceRange(categoryProducts) : [0, 10000];
  const availableColors = getAllColors(categoryProducts);
  const filteredProducts = filterProducts(categoryProducts, filters);
  const sortedProducts = sortProducts(filteredProducts, filters.sortBy);

  const handleResetFilters = () => {
    setFilters({
      gender: category && category.gender !== "Unisex" ? [category.gender] : [],
      categories: category ? [category.id] : [],
      priceRange: priceRange as [number, number],
      sizes: [],
      colors: [],
      inStock: false,
      searchQuery: "",
      sortBy: "newest",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!category) return null;

  const isGenderSpecific = category.gender !== "Unisex";
  const genderDisplayName = isGenderSpecific
    ? dbGenderToDisplayName(category.gender)
    : null;
  const genderUrlSlug = category.gender?.toLowerCase();

  const pageTitle =
    isGenderSpecific && genderDisplayName
      ? `${genderDisplayName} ${category.name}`
      : category.name;

  return (
    <div className="min-h-screen bg-[#E3D9C6]">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            {genderDisplayName && (
              <>
                <Link
                  href={`/products/gender/${genderUrlSlug}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {genderDisplayName}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900">{category.name}</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
          {!isGenderSpecific && (
            <p className="text-gray-600 mb-2">
              Showing products for all genders
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) =>
                  setFilters({ ...filters, searchQuery: value })
                }
                placeholder={`Search ${category.name.toLowerCase()}...`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as FilterState["sortBy"],
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link — only for gendered categories */}
        {isGenderSpecific && genderDisplayName && (
          <Link
            href={`/products/gender/${genderUrlSlug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to {genderDisplayName}
          </Link>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-4">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                availableColors={availableColors}
                priceRange={priceRange as [number, number]}
                onReset={handleResetFilters}
                availableCategories={[category]}
              />
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {mobileFiltersOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-[#E3D9C6]/50"
              onClick={() => setMobileFiltersOpen(false)}
            >
              <div
                className="absolute right-0 top-0 h-full w-80 bg-[#E3D9C6] p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  availableColors={availableColors}
                  priceRange={priceRange as [number, number]}
                  onReset={handleResetFilters}
                  availableCategories={[category]}
                />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-semibold">{sortedProducts.length}</span>{" "}
                of{" "}
                <span className="font-semibold">{categoryProducts.length}</span>{" "}
                products
              </p>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No products found</p>
                <p className="text-gray-400 text-sm mb-4">
                  {categoryProducts.length === 0
                    ? `No ${category.name.toLowerCase()} available yet.`
                    : "Try adjusting your filters"}
                </p>
                {categoryProducts.length > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}