// ========================================
// lib/categories-db.ts - Database operations
// ========================================

import { supabase } from './supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  gender: 'Male' | 'Female' | 'Unisex';
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
  total_stock?: number;
}

// ========================================
// FETCH OPERATIONS
// ========================================

export async function getCategories(includeInactive = false): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getCategoriesByGender(
  gender: 'Male' | 'Female',
  includeInactive = false
): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('gender', gender)
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getCategoriesWithCount(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories_with_product_count')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string, gender?: 'Male' | 'Female'): Promise<Category | null> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true);

  // If gender is provided, filter by it
  if (gender) {
    query = query.eq('gender', gender);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ========================================
// ADMIN OPERATIONS
// ========================================

export async function createCategory(
  category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'product_count' | 'total_stock'>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  // Check if category has products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (count && count > 0) {
    throw new Error(`Cannot delete category with ${count} products. Please reassign or delete products first.`);
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleCategoryStatus(id: string): Promise<Category> {
  const category = await getCategoryById(id);
  if (!category) throw new Error('Category not found');

  return updateCategory(id, { is_active: !category.is_active });
}

export async function reorderCategories(
  categoryIds: string[]
): Promise<void> {
  const updates = categoryIds.map((id, index) => ({
    id,
    display_order: index + 1,
  }));

  for (const update of updates) {
    await supabase
      .from('categories')
      .update({ display_order: update.display_order })
      .eq('id', update.id);
  }
}

// ========================================
// app/api/categories/route.ts - API endpoint
// ========================================

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender') as 'Male' | 'Female' | null;
    const withCount = searchParams.get('withCount') === 'true';

    let categories;

    if (withCount) {
      categories = await getCategoriesWithCount();
    } else if (gender) {
      categories = await getCategoriesByGender(gender);
    } else {
      categories = await getCategories();
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: unknown) {
    console.error('Categories API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

