// app/api/admin/products/route.ts - FIXED TYPE ERRORS

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Type definitions
interface ProductImage {
  image_url: string;
  display_order?: number;
  is_primary?: boolean;
}

interface SizeChartEntry {
  size: string;
  chest?: number | null;
  length?: number | null;
  bust?: number | null;
  length_female?: number | null;
  notes?: string;
}

interface ProductBody {
  id?: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  gender: string;
  stock: number;
  sizes?: string[];
  colors?: string[];
  has_size_chart?: boolean;
  images?: ProductImage[];
  size_chart?: SizeChartEntry[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  sku?: string;
}

// Helper function to delete image from Cloudinary
async function deleteFromCloudinary(imageUrl: string) {
  try {
    const regex = /\/products\/([^/.]+)/;
    const match = imageUrl.match(regex);
    
    if (!match) return;
    
    const publicId = `products/${match[1]}`;
    
    await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    
    console.log('✅ Deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Failed to delete from Cloudinary:', error);
  }
}

export async function GET(request: Request) {
  try {
    console.log('📦 Admin Products API called');

    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit');
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const outOfStock = searchParams.get('outOfStock');

    let query = supabase
      .from('products')
      .select('*');

    if (gender) query = query.eq('gender', gender);
    if (category) query = query.eq('category', category);
    if (lowStock === 'true') query = query.lte('stock', 5).gt('stock', 0);
    if (outOfStock === 'true') query = query.eq('stock', 0);
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
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true });

        const { data: sizeChart } = await supabase
          .from('size_charts')
          .select('*')
          .eq('product_id', product.id);

        return {
          ...product,
          images: images || [],
          size_chart: sizeChart || [],
        };
      })
    );

    console.log(`✅ Found ${productsWithDetails.length} products with images and size charts`);

    return NextResponse.json(productsWithDetails, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Admin Products API Error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('📝 Creating new product...');

    const body = await request.json() as ProductBody;
    
    const requiredFields: (keyof ProductBody)[] = ['name', 'price', 'category', 'gender', 'stock'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Ensure we have at least one image
    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'At least one product image is required' },
        { status: 400 }
      );
    }

    // Validate ShipRocket fields
    if (!body.weight || body.weight < 0.1) {
      return NextResponse.json(
        { error: 'Weight must be at least 0.1 kg' },
        { status: 400 }
      );
    }

    if (!body.length || body.length < 1) {
      return NextResponse.json(
        { error: 'Length must be at least 1 cm' },
        { status: 400 }
      );
    }

    if (!body.breadth || body.breadth < 1) {
      return NextResponse.json(
        { error: 'Breadth must be at least 1 cm' },
        { status: 400 }
      );
    }

    if (!body.height || body.height < 1) {
      return NextResponse.json(
        { error: 'Height must be at least 1 cm' },
        { status: 400 }
      );
    }

    // Use the primary image or first image as main image_url
    const primaryImage = body.images.find((img) => img.is_primary) || body.images[0];

    console.log('📸 Inserting product with images:', body.images.length);
    console.log('📦 ShipRocket details:', {
      weight: body.weight,
      dimensions: `${body.length}x${body.breadth}x${body.height}`,
      sku: body.sku || 'auto-generated'
    });

    // Insert product with ShipRocket fields
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: primaryImage.image_url,
        category: body.category,
        sizes: body.sizes || ['S', 'M', 'L', 'XL'],
        colors: body.colors || [],
        stock: body.stock,
        gender: body.gender,
        has_size_chart: body.has_size_chart || false,
        // ShipRocket fields
        weight: body.weight || 0.5,
        length: body.length || 10,
        breadth: body.breadth || 10,
        height: body.height || 5,
        sku: body.sku || null, // Will use product ID if null
      })
      .select()
      .single();

    if (productError) {
      console.error('❌ Create product error:', productError);
      throw productError;
    }

    console.log('✅ Product created with ID:', product.id);

    // Auto-generate SKU if not provided
    if (!body.sku) {
      const autoSku = `SKU-${product.id}`;
      await supabase
        .from('products')
        .update({ sku: autoSku })
        .eq('id', product.id);
      
      console.log('✅ Auto-generated SKU:', autoSku);
    }

    // Insert product images
    if (body.images && body.images.length > 0) {
      const imagesToInsert = body.images.map((img, index) => ({
        product_id: product.id,
        image_url: img.image_url,
        display_order: img.display_order ?? index,
        is_primary: img.is_primary || false,
      }));

      console.log('📸 Inserting images:', imagesToInsert);

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (imagesError) {
        console.error('❌ Insert images error:', imagesError);
      } else {
        console.log(`✅ Inserted ${imagesToInsert.length} images`);
      }
    }

    // Insert size chart if provided
    if (body.has_size_chart && body.size_chart && body.size_chart.length > 0) {
      const sizeChartToInsert = body.size_chart.map((chart) => ({
        product_id: product.id,
        size: chart.size,
        chest: chart.chest || null,
        length: chart.length || null,
        bust: chart.bust || null,
        length_female: chart.length_female || null,
        notes: chart.notes || '',
      }));

      console.log('📏 Inserting size chart:', sizeChartToInsert);

      const { error: chartError } = await supabase
        .from('size_charts')
        .insert(sizeChartToInsert);

      if (chartError) {
        console.error('❌ Insert size chart error:', chartError);
      } else {
        console.log(`✅ Inserted ${sizeChartToInsert.length} size chart entries`);
      }
    }

    return NextResponse.json(
      { success: true, product },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Create product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('✏️ Updating product...');

    const body = await request.json() as ProductBody;
    const { id, images, size_chart, has_size_chart, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating product ID:', id);
    console.log('📸 New images count:', images?.length || 0);

    // Validate ShipRocket fields if provided
    if (updates.weight !== undefined && updates.weight < 0.1) {
      return NextResponse.json(
        { error: 'Weight must be at least 0.1 kg' },
        { status: 400 }
      );
    }

    if (updates.length !== undefined && updates.length < 1) {
      return NextResponse.json(
        { error: 'Length must be at least 1 cm' },
        { status: 400 }
      );
    }

    if (updates.breadth !== undefined && updates.breadth < 1) {
      return NextResponse.json(
        { error: 'Breadth must be at least 1 cm' },
        { status: 400 }
      );
    }

    if (updates.height !== undefined && updates.height < 1) {
      return NextResponse.json(
        { error: 'Height must be at least 1 cm' },
        { status: 400 }
      );
    }

    // Update primary image_url if images are provided
    if (images && images.length > 0) {
      const primaryImage = images.find((img) => img.is_primary) || images[0];
      (updates as Record<string, unknown>).image_url = primaryImage.image_url;
    }

    // Update has_size_chart flag
    (updates as Record<string, unknown>).has_size_chart = has_size_chart || false;

    console.log('📦 Updating ShipRocket fields:', {
      weight: updates.weight,
      length: updates.length,
      breadth: updates.breadth,
      height: updates.height,
      sku: updates.sku
    });

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('❌ Update product error:', productError);
      throw productError;
    }

    console.log('✅ Product updated:', product.id);

    // Handle images update
    if (images !== undefined) {
      // Fetch old images to delete from Cloudinary
      const { data: oldImages } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', id);

      // Delete existing images from database
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      console.log('🗑️ Deleted old images from database');

      // Delete old images from Cloudinary (optional)
      if (oldImages && oldImages.length > 0) {
        const newImageUrls = images.map((img) => img.image_url);
        const imagesToDelete = oldImages.filter(
          (oldImg) => !newImageUrls.includes(oldImg.image_url)
        );
        
        for (const img of imagesToDelete) {
          await deleteFromCloudinary(img.image_url);
        }
      }

      // Insert new images
      if (images.length > 0) {
        const imagesToInsert = images.map((img, index) => ({
          product_id: id,
          image_url: img.image_url,
          display_order: img.display_order ?? index,
          is_primary: img.is_primary || false,
        }));

        console.log('📸 Inserting new images:', imagesToInsert);

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('❌ Update images error:', imagesError);
        } else {
          console.log(`✅ Updated ${imagesToInsert.length} images`);
        }
      }
    }

    // Handle size chart update
    if (has_size_chart !== undefined) {
      // Delete existing size chart
      await supabase
        .from('size_charts')
        .delete()
        .eq('product_id', id);

      console.log('🗑️ Deleted old size chart');

      // Insert new size chart if enabled
      if (has_size_chart && size_chart && size_chart.length > 0) {
        const sizeChartToInsert = size_chart.map((chart) => ({
          product_id: id,
          size: chart.size,
          chest: chart.chest || null,
          length: chart.length || null,
          bust: chart.bust || null,
          length_female: chart.length_female || null,
          notes: chart.notes || '',
        }));

        console.log('📏 Inserting new size chart:', sizeChartToInsert);

        const { error: chartError } = await supabase
          .from('size_charts')
          .insert(sizeChartToInsert);

        if (chartError) {
          console.error('❌ Update size chart error:', chartError);
        } else {
          console.log(`✅ Updated ${sizeChartToInsert.length} size chart entries`);
        }
      }
    }

    return NextResponse.json(
      { success: true, product },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Update product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

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

    // Fetch product images before deletion
    const { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);

    // Delete product (CASCADE will handle images and size_charts in DB)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete product error:', error);
      throw error;
    }

    console.log('✅ Product deleted from database:', id);

    // Delete images from Cloudinary
    if (images && images.length > 0) {
      console.log(`🗑️ Deleting ${images.length} images from Cloudinary...`);
      for (const img of images) {
        await deleteFromCloudinary(img.image_url);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Delete product error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}