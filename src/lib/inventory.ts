// ========================================
// lib/inventory.ts - NEW FILE
// Handles inventory management and stock updates
// ========================================

import { supabase } from './supabase';

export interface StockUpdate {
  product_id: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface InventoryTransaction {
  product_id: number;
  order_id?: string;
  quantity_change: number;
  reason: 'order_placed' | 'order_cancelled' | 'order_refunded' | 'manual_adjustment' | 'exchange_return';
  previous_stock: number;
  new_stock: number;
  created_at?: string;
}

/**
 * Update stock for multiple products (atomic operation)
 * Used when creating orders
 */
export async function updateProductStock(updates: StockUpdate[]): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Process each product stock update
    for (const update of updates) {
      const { product_id, quantity } = update;
      
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', product_id)
        .single();
      
      if (fetchError || !product) {
        errors.push(`Product ${product_id} not found`);
        continue;
      }
      
      // Check if enough stock
      if (product.stock < quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
        continue;
      }
      
      // Calculate new stock
      const newStock = product.stock - quantity;
      
      // Update stock - only update stock field
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id);
      
      if (updateError) {
        errors.push(`Failed to update stock for ${product.name}: ${updateError.message}`);
        continue;
      }
      
      console.log(`✅ Stock updated: ${product.name} (${product.stock} → ${newStock})`);
    }
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error: any) {
    console.error('❌ Stock update error:', error);
    return {
      success: false,
      errors: [error.message || 'Failed to update stock']
    };
  }
}

/**
 * Restore stock for cancelled/refunded orders
 */
export async function restoreProductStock(updates: StockUpdate[]): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    for (const update of updates) {
      const { product_id, quantity } = update;
      
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', product_id)
        .single();
      
      if (fetchError || !product) {
        errors.push(`Product ${product_id} not found`);
        continue;
      }
      
      // Add back to stock
      const newStock = product.stock + quantity;
      
      // Update stock - only update stock field
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id);
      
      if (updateError) {
        errors.push(`Failed to restore stock for ${product.name}: ${updateError.message}`);
        continue;
      }
      
      console.log(`✅ Stock restored: ${product.name} (${product.stock} → ${newStock})`);
    }
    
    return {
      success: errors.length === 0,
      errors
    };
    
  } catch (error: any) {
    console.error('❌ Stock restore error:', error);
    return {
      success: false,
      errors: [error.message || 'Failed to restore stock']
    };
  }
}

/**
 * Check if products have sufficient stock before order
 */
export async function validateStock(items: StockUpdate[]): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', item.product_id)
        .single();
      
      if (error || !product) {
        errors.push(`Product ${item.product_id} not found`);
        continue;
      }
      
      if (product.stock < item.quantity) {
        errors.push(
          `${product.name} - Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
    
  } catch (error: any) {
    console.error('❌ Stock validation error:', error);
    return {
      valid: false,
      errors: [error.message || 'Failed to validate stock']
    };
  }
}

/**
 * Get low stock products (stock <= threshold)
 */
export async function getLowStockProducts(threshold: number = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock, image_url, price')
    .lte('stock', threshold)
    .gt('stock', 0)
    .order('stock', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Get out of stock products
 */
export async function getOutOfStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock, image_url, price')
    .eq('stock', 0);
  
  if (error) throw error;
  return data;
}