// lib/supabase-orders.ts - UPDATED WITH INVENTORY MANAGEMENT

import { supabase } from './supabase'
import { validateStock, updateProductStock, restoreProductStock } from './inventory'

// =====================
// Types
// =====================

export interface Address {
  email: string
  id?: string
  user_id: string
  first_name: string
  last_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  product_image: string
  size: string
  color: string
  quantity: number
  price: number
  subtotal: number
}

export interface Order {
  id?: string
  user_id: string
  order_number?: string

  /** ✅ Email belongs to Order, NOT Address */
  customer_email?: string

  items: OrderItem[]
  subtotal: number
  tax: number
  shipping_cost: number
  total: number

  shipping_address: Address

  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'

  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string

  order_status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'

  created_at?: string
  updated_at?: string
  paid_at?: string
  shipped_at?: string
  delivered_at?: string
}


// ========== ADDRESS FUNCTIONS ==========

export async function getAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Address[];
}

export async function getDefaultAddress(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Address | null;
}

export async function createAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>) {
  if (address.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', address.user_id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single();

  if (error) throw error;
  return data as Address;
}

export async function updateAddress(id: string, updates: Partial<Address>) {
  if (updates.is_default && updates.user_id) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', updates.user_id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string) {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== ORDER FUNCTIONS ==========

const orderCreationLimits = new Map<string, { count: number; resetTime: number }>();

function checkOrderCreationLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const userLimit = orderCreationLimits.get(userId);
  
  const LIMIT = 3;
  const WINDOW = 10 * 60 * 1000;

  if (!userLimit || userLimit.resetTime < now) {
    orderCreationLimits.set(userId, {
      count: 1,
      resetTime: now + WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= LIMIT) {
    const minutesLeft = Math.ceil((userLimit.resetTime - now) / 1000 / 60);
    return {
      allowed: false,
      message: `Too many orders. Please wait ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} before placing another order.`
    };
  }

  userLimit.count++;
  return { allowed: true };
}

// ✅ UPDATED: Create order with automatic inventory update and better error handling
export async function createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) {
  // Check rate limit
  const rateLimitCheck = checkOrderCreationLimit(order.user_id);
  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.message || 'Rate limit exceeded');
  }

  // Validate order data
  if (!order.user_id) {
    throw new Error('User ID is required');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  if (order.total <= 0) {
    throw new Error('Invalid order total');
  }

  if (!order.shipping_address) {
    throw new Error('Shipping address is required');
  }

  // Validate each item
  for (const item of order.items) {
    if (!item.product_id || !item.product_name || item.quantity <= 0 || item.price <= 0) {
      throw new Error(`Invalid item data for ${item.product_name}`);
    }
  }

  // ✅ STEP 1: Validate stock availability
  console.log('📦 Validating stock availability...');
  const stockValidation = await validateStock(
    order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    }))
  );

  if (!stockValidation.valid) {
    throw new Error(`Stock validation failed: ${stockValidation.errors.join(', ')}`);
  }

  // ✅ STEP 2: Generate order number and create order in database
  console.log('📝 Creating order in database...');
  
  // Generate unique order number (format: ORD-TIMESTAMP-RANDOM)
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  
  const orderWithNumber = {
    ...order,
    order_number: orderNumber
  };
  
  console.log('Order data:', {
    order_number: orderNumber,
    user_id: order.user_id,
    items_count: order.items.length,
    total: order.total,
    payment_method: order.payment_method,
    has_shipping_address: !!order.shipping_address
  });

  const { data, error } = await supabase
    .from('orders')
    .insert(orderWithNumber)
    .select()
    .single();

  if (error) {
    console.error('❌ Order creation error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Provide a more helpful error message
    let errorMessage = 'Failed to create order';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.details) {
      errorMessage = `Database error: ${error.details}`;
    } else if (error.code) {
      errorMessage = `Database error code: ${error.code}`;
    } else {
      errorMessage = 'Failed to create order. Please check that all required fields are provided.';
    }
    
    throw new Error(errorMessage);
  }

  if (!data) {
    throw new Error('Order created but no data returned from database');
  }

  // ✅ STEP 3: Update product stock
  console.log('📉 Updating product inventory...');
  try {
    const stockUpdate = await updateProductStock(
      order.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }))
    );

    if (!stockUpdate.success) {
      console.error('❌ Stock update failed:', stockUpdate.errors);
      
      // Rollback: Delete the order if stock update failed
      console.log('🔄 Rolling back order creation...');
      await supabase.from('orders').delete().eq('id', data.id);
      
      throw new Error(`Stock update failed: ${stockUpdate.errors.join(', ')}. Order has been cancelled.`);
    }
  } catch (stockError) {
    console.error('❌ Stock update exception:', stockError);
    
    // Rollback: Delete the order
    console.log('🔄 Rolling back order creation due to exception...');
    await supabase.from('orders').delete().eq('id', data.id);
    
    throw new Error(`Failed to update inventory: ${stockError instanceof Error ? stockError.message : 'Unknown error'}. Order has been cancelled.`);
  }

  console.log('✅ Order created successfully with inventory updated:', data.id);
  return data as Order;
}

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderPayment(
  orderId: string,
  paymentData: {
    razorpay_payment_id: string;
    razorpay_signature: string;
    payment_status: 'paid' | 'failed';
    paid_at?: string;
  }
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      ...paymentData,
      order_status: paymentData.payment_status === 'paid' ? 'confirmed' : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['order_status']) {
  const updates: any = {
    order_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'shipped') updates.shipped_at = new Date().toISOString();
  if (status === 'delivered') updates.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// ✅ UPDATED: Cancel order and restore stock
export async function cancelOrder(orderId: string) {
  // Get order details
  const order = await getOrderById(orderId);
  
  // Restore stock
  console.log('📈 Restoring product inventory...');
  const stockRestore = await restoreProductStock(
    order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    }))
  );

  if (!stockRestore.success) {
    console.error('⚠️ Stock restore had errors:', stockRestore.errors);
  }

  // Update order status
  return updateOrderStatus(orderId, 'cancelled');
}