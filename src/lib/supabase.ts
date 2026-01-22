// lib/supabase.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Product } from "./types";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder'
    );
  }

  return supabaseInstance;
}

// Backward compatible export - this getter ensures lazy initialization
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const instance = getSupabase();
    const value = instance[prop as keyof SupabaseClient];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Helper function to fetch images and size chart for a product
async function enrichProductWithDetails(product: any): Promise<Product> {
  const client = getSupabase();
  
  // Fetch product images
  const { data: images } = await client
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Fetch size chart if available
  let sizeChart = [];
  if (product.has_size_chart) {
    const { data: chart } = await client
      .from('size_charts')
      .select('*')
      .eq('product_id', product.id);
    
    sizeChart = chart || [];
  }

  return {
    ...product,
    images: images || [],
    size_chart: sizeChart,
  } as Product;
}

// Fetch all products with images and size charts
export async function getProducts() {
  const client = getSupabase();
  
  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Enrich each product with images and size chart
  const enrichedProducts = await Promise.all(
    (data || []).map(enrichProductWithDetails)
  );

  return enrichedProducts;
}

// Fetch single product by slug with images and size chart
export async function getProductBySlug(slug: string) {
  const client = getSupabase();
  
  const { data, error } = await client
    .from("products")
    .select("*")
    .ilike("name", slug.replace(/-/g, " "))
    .single();

  if (error) throw error;

  return await enrichProductWithDetails(data);
}

// Fetch products by category with images and size charts
export async function getProductsByCategory(categorySlug: string) {
  const client = getSupabase();
  
  const parts = categorySlug.split("-");
  const gender = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const category = parts
    .slice(1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const categoryName = `${gender}-${category}`;

  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("category", categoryName)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const enrichedProducts = await Promise.all(
    (data || []).map(enrichProductWithDetails)
  );

  return enrichedProducts;
}

// Fetch products by gender with images and size charts
export async function getProductsByGender(gender: "Male" | "Female") {
  const client = getSupabase();
  
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("gender", gender)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const enrichedProducts = await Promise.all(
    (data || []).map(enrichProductWithDetails)
  );

  return enrichedProducts;
}

// Search products with images and size charts
export async function searchProducts(query: string) {
  const client = getSupabase();
  
  const { data, error } = await client
    .from("products")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const enrichedProducts = await Promise.all(
    (data || []).map(enrichProductWithDetails)
  );

  return enrichedProducts;
}