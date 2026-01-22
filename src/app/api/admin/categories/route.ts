// app/api/admin/categories/route.ts - Admin API with SERVICE ROLE
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET - Fetch all categories (including inactive)
export async function GET(request: Request) {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: categories || [] });
  } catch (error: any) {
    console.error('Admin GET categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📝 Creating category:', body);

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: body.name,
        slug: body.slug,
        gender: body.gender,
        description: body.description || null,
        image_url: body.image_url || null,
        display_order: body.display_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      throw error;
    }

    console.log('✅ Category created:', category);

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Admin POST categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      throw new Error('Category ID is required');
    }

    console.log('📝 Updating category:', id, updates);

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      throw error;
    }

    console.log('✅ Category updated:', category);

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Admin PUT categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) throw new Error("Category ID required");

    console.log('🗑️ Deleting category:', id);

    // Check if category has products
    const { count } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete category with ${count} products. Please reassign or delete products first.`);
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }

    console.log('✅ Category deleted');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin DELETE categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}