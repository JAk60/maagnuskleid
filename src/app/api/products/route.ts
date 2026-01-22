// app/api/products/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('📦 Public Products API called');

    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit');
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');

    // Build query for products
    let query = supabase
      .from('products')
      .select('*');

    if (gender) query = query.eq('gender', gender);
    if (category) query = query.eq('category', category);
    if (inStock === 'true') query = query.gt('stock', 0);
    if (limit) query = query.limit(parseInt(limit));

    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Products query error:', error);
      throw error;
    }

    // Fetch images and size charts for each product
    const productsWithDetails = await Promise.all(
      (products || []).map(async (product) => {
        // Fetch product images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true });

        // Fetch size chart if has_size_chart is true
        let sizeChart = [];
        if (product.has_size_chart) {
          const { data: chart } = await supabase
            .from('size_charts')
            .select('*')
            .eq('product_id', product.id)
            .order('size', { ascending: true });
          
          sizeChart = chart || [];
        }

        return {
          ...product,
          images: images || [],
          size_chart: sizeChart,
        };
      })
    );

    console.log(`✅ Found ${productsWithDetails.length} products`);

    return NextResponse.json(productsWithDetails, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });

  } catch (error: any) {
    console.error('❌ Public Products API Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    );
  }
}
// POST - Create new product
export async function POST(request: Request) {
  try {
    console.log('📝 Creating new product...');

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'price', 'category', 'gender', 'stock'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert product
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: body.image_url || '',
        category: body.category,
        sizes: body.sizes || ['S', 'M', 'L', 'XL'],
        colors: body.colors || ['Black'],
        stock: body.stock,
        gender: body.gender,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Create product error:', error);
      throw error;
    }

    console.log('✅ Product created:', data.id);

    return NextResponse.json(
      { success: true, product: data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Create product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update product
export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating product...');

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update product error:', error);
      throw error;
    }

    console.log('✅ Product updated:', data.id);

    return NextResponse.json(
      { success: true, product: data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Update product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ Deleting product...');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete product error:', error);
      throw error;
    }

    console.log('✅ Product deleted:', id);

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Delete product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}