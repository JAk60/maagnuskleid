// app/products/gender/[gender]/[category]/page.tsx - FIXED VERSION

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, FilterState } from '@/lib/types';
import { getProducts } from '@/lib/supabase';
import {
  filterProducts,
  sortProducts,
  getAllColors,
  getPriceRange,
  addSlugToProduct,
  urlGenderToDbGender,
  dbGenderToUrlGender,
  dbGenderToDisplayName,
  dbCategoryToDisplayName,
  extractCategoryFromSlug, // Import the helper
} from '@/utils/helpers';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar from '@/components/products/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import { SlidersHorizontal, X, ChevronLeft } from 'lucide-react';

export default function GenderCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const genderParam = params.gender as string;
  const categorySlug = params.category as string;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    categories: [],
    priceRange: [0, 100],
    sizes: [],
    colors: [],
    inStock: false,
    searchQuery: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Convert URL gender to DB gender
        const genderValue = urlGenderToDbGender(genderParam);

        console.log('🔍 Gender from URL:', genderParam, '→', genderValue);

        if (!genderValue) {
          console.log('❌ Invalid gender, redirecting to /products');
          router.push('/products');
          return;
        }

        setGender(genderValue);

        // Extract category name from slug
        const dbCategory = extractCategoryFromSlug(categorySlug);
        console.log('🔍 Category from URL:', categorySlug, '→', dbCategory);
        setCategoryName(dbCategory);

        // Fetch all products
        const products = await getProducts();
        console.log('📦 Total products fetched:', products.length);

        const productsWithSlugs = products.map(addSlugToProduct);
        setAllProducts(productsWithSlugs);

        // Debug logging BEFORE filtering
        console.log('🔥 ALL UNIQUE CATEGORIES:', [...new Set(productsWithSlugs.map(p => p.category))]);
        console.log('🔥 ALL UNIQUE GENDERS:', [...new Set(productsWithSlugs.map(p => p.gender))]);
        console.log('🔥 LOOKING FOR - Gender:', genderValue, '| Category:', dbCategory);
        
        // Show all Female products with their categories
        const femaleProducts = productsWithSlugs.filter(p => p.gender === 'Female');
        console.log('👗 All Female products and their categories:');
        femaleProducts.forEach(p => {
          console.log(`  - "${p.name}" → category: "${p.category}" (length: ${p.category.length})`);
        });
        
        // Filter by gender AND category
        const filtered = productsWithSlugs.filter(p => 
          p.gender === genderValue && p.category === dbCategory
        );

        console.log('✅ Filtered products:', filtered.length);
        
        if (filtered.length > 0) {
          console.log('Sample filtered product:', filtered[0]);
        } else {
          console.log('❌ NO MATCHES - Trying exact string comparison:');
          console.log(`  Looking for category exactly matching: "${dbCategory}"`);
          const possibleMatches = productsWithSlugs.filter(p => 
            p.gender === genderValue && p.category.toLowerCase().includes('baby')
          );
          console.log('  Products with "baby" in category:', possibleMatches.length);
          if (possibleMatches.length > 0) {
            console.log('  Example:', possibleMatches[0].category);
          }
        }

        setCategoryProducts(filtered);

        // Set initial price range and pre-select the gender + category
        const range = filtered.length > 0 ? getPriceRange(filtered) : [0, 100];
        setFilters(prev => ({
          ...prev,
          priceRange: range as [number, number],
          gender: [genderValue],
          categories: [dbCategory]
        }));

      } catch (error) {
        console.error('💥 Error fetching products:', error);
        router.push('/products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [genderParam, categorySlug, router]);

  const priceRange = categoryProducts.length > 0 ? getPriceRange(categoryProducts) : [0, 100];
  const availableColors = getAllColors(categoryProducts);
  const filteredProducts = filterProducts(categoryProducts, filters);
  const sortedProducts = sortProducts(filteredProducts, filters.sortBy);

  const handleResetFilters = () => {
    setFilters({
      gender: gender ? [gender] : [],
      categories: categoryName ? [categoryName] : [],
      priceRange: priceRange as [number, number],
      sizes: [],
      colors: [],
      inStock: false,
      searchQuery: '',
      sortBy: 'newest',
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

  if (!gender || !categoryName) {
    return null;
  }

  // Use helpers for display names
  const genderDisplayName = dbGenderToDisplayName(gender);
  const categoryDisplayName = categoryName; // Already in display format from extractCategoryFromSlug
  const genderUrlSlug = dbGenderToUrlGender(gender);

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
            <Link
              href={`/products/gender/${genderUrlSlug}`}
              className="text-gray-600 hover:text-gray-900"
            >
              {genderDisplayName}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{categoryDisplayName}</span>
          </div>

          <h1 className="text-3xl font-bold mb-6">
            {genderDisplayName} {categoryDisplayName}
          </h1>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={filters.searchQuery}
                onChange={(value) => setFilters({ ...filters, searchQuery: value })}
                placeholder={`Search ${categoryDisplayName.toLowerCase()}...`}
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
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
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
        {/* Back Link */}
        <Link
          href={`/products/gender/${genderUrlSlug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to {genderDisplayName}
        </Link>

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
                availableCategories={[categoryName]}
              />
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-[#E3D9C6]/50" onClick={() => setMobileFiltersOpen(false)}>
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
                  availableCategories={[categoryName]}
                />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{sortedProducts.length}</span> of{' '}
                <span className="font-semibold">{categoryProducts.length}</span> products
              </p>
            </div>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No products found</p>
                <p className="text-gray-400 text-sm mb-4">
                  {categoryProducts.length === 0
                    ? `There are currently no ${categoryDisplayName.toLowerCase()} available in this category.`
                    : 'Try adjusting your filters'}
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