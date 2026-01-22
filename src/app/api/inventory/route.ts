// ========================================
// app/api/inventory/route.ts - NEW FILE
// API for inventory management
// ========================================

import { NextResponse } from 'next/server';
import { 
  getLowStockProducts, 
  getOutOfStockProducts,
  updateProductStock,
  restoreProductStock,
  validateStock 
} from '@/lib/inventory';

// GET - Get inventory status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'low-stock' | 'out-of-stock'

    if (type === 'low-stock') {
      const products = await getLowStockProducts(5);
      return NextResponse.json({
        success: true,
        data: products
      });
    }

    if (type === 'out-of-stock') {
      const products = await getOutOfStockProducts();
      return NextResponse.json({
        success: true,
        data: products
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter. Use "low-stock" or "out-of-stock"'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Inventory API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Validate stock or update stock
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, items } = body;

    if (action === 'validate') {
      // Validate if stock is available
      const result = await validateStock(items);
      return NextResponse.json({
        success: true,
        valid: result.valid,
        errors: result.errors
      });
    }

    if (action === 'update') {
      // Update stock (deduct)
      const result = await updateProductStock(items);
      return NextResponse.json({
        success: result.success,
        errors: result.errors
      });
    }

    if (action === 'restore') {
      // Restore stock (add back)
      const result = await restoreProductStock(items);
      return NextResponse.json({
        success: result.success,
        errors: result.errors
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "validate", "update", or "restore"'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Inventory Action Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}