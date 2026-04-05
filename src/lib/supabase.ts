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

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const instance = getSupabase();
    const value = instance[prop as keyof SupabaseClient];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// ─── Matches your actual schema columns exactly ──────────────────────────────

const PRODUCT_SELECT = `
  *,
  product_images (
    id, product_id, image_url, display_order, is_primary, created_at
  ),
  size_charts (
    id, product_id, size, chest, length, bust, length_female, notes, created_at, updated_at
  )
`;

function normalizeProduct(p: Record<string, unknown>): Product {
  return {
    ...p,
    images: p.product_images ?? [],
    size_chart: p.size_charts ?? [],
  } as Product;
}

export async function getProducts(): Promise<Product[]> {
  const client = getSupabase();

  const { data, error } = await client
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const client = getSupabase();

  const { data, error } = await client
    .from("products")
    .select(PRODUCT_SELECT)
    .ilike("name", slug.replace(/-/g, " "))
    .single();

  if (error) throw error;
  return normalizeProduct(data);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
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
    .select(PRODUCT_SELECT)
    .eq("category", categoryName)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getProductsByGender(gender: "Male" | "Female"): Promise<Product[]> {
  const client = getSupabase();

  const { data, error } = await client
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("gender", gender)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const client = getSupabase();

  const { data, error } = await client
    .from("products")
    .select(PRODUCT_SELECT)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}


export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category_obj:categories(id, name, slug, gender),
      images:product_images(image_url, display_order, is_primary),
      size_chart:size_charts(size, chest, length, bust, length_female, notes)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as unknown as Product;
}