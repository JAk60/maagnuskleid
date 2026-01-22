// lib/shiprocket/orderService.ts - FIXED FOR BUILD
import { createClient } from '@supabase/supabase-js';
import { shipRocketClient } from './client';
import {
  ShipRocketCreateOrderPayload,
  ShipRocketOrderItem,
} from './types';

// Type definitions for order data structures
interface OrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  price: string | number;
}

interface ShippingAddress {
  first_name: string;
  last_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  state: string;
  country?: string;
  phone: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  user_id: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  payment_status: string;
  shipping_cost: string | number;
  subtotal: string | number;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  shiprocket_status?: string;
  order_status: string;
}

interface ProductDimensions {
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

interface Product {
  sku?: string;
  name?: string;
}

// ✅ FIX: Lazy initialization
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Calculate package dimensions from order items
 */
async function calculatePackageDimensions(items: OrderItem[]): Promise<{
  weight: number;
  length: number;
  breadth: number;
  height: number;
}> {
  const supabase = getSupabaseClient();
  
  let totalWeight = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let totalHeight = 0;

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('weight, length, breadth, height')
      .eq('id', item.product_id)
      .single<ProductDimensions>();

    if (product) {
      const qty = item.quantity || 1;
      totalWeight += (product.weight || 0.5) * qty;
      maxLength = Math.max(maxLength, product.length || 10);
      maxBreadth = Math.max(maxBreadth, product.breadth || 10);
      totalHeight += (product.height || 5) * qty;
    } else {
      totalWeight += 0.5;
      maxLength = Math.max(maxLength, 10);
      maxBreadth = Math.max(maxBreadth, 10);
      totalHeight += 5;
    }
  }

  return {
    weight: Math.max(totalWeight, 0.5),
    length: Math.max(maxLength, 10),
    breadth: Math.max(maxBreadth, 10),
    height: Math.max(totalHeight, 5),
  };
}

/**
 * Transform order items to ShipRocket format
 */
async function transformOrderItems(items: OrderItem[]): Promise<ShipRocketOrderItem[]> {
  const supabase = getSupabaseClient();
  const shipRocketItems: ShipRocketOrderItem[] = [];

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('sku, name')
      .eq('id', item.product_id)
      .single<Product>();

    shipRocketItems.push({
      name: item.product_name || product?.name || 'Product',
      sku: product?.sku || `SKU-${item.product_id}`,
      units: item.quantity || 1,
      selling_price: Number(item.price) || 0,
      discount: 0,
      tax: 0,
      hsn: 0,
    });
  }

  return shipRocketItems;
}

/**
 * Create ShipRocket order from Supabase order
 */
export async function createShipRocketOrder(orderId: string) {
  const supabase = getSupabaseClient();

  try {
    console.log(`Creating ShipRocket order for: ${orderId}`);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single<Order>();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.shiprocket_order_id) {
      console.log(`Order already synced to ShipRocket: ${order.shiprocket_order_id}`);
      return {
        success: true,
        message: 'Order already synced',
        shiprocket_order_id: order.shiprocket_order_id,
      };
    }

    const shippingAddress = order.shipping_address;
    const items = order.items;

    const dimensions = await calculatePackageDimensions(items);
    const orderItems = await transformOrderItems(items);

    const { data: user } = await supabase.auth.admin.getUserById(order.user_id);
    const userEmail = user?.user?.email || 'customer@example.com';

    const payload: ShipRocketCreateOrderPayload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_NAME || 'Primary',
      channel_id: '',
      comment: `Order from StyleHub - ${order.order_number}`,
      billing_customer_name: shippingAddress.first_name,
      billing_last_name: shippingAddress.last_name || '',
      billing_address: shippingAddress.address_line1,
      billing_address_2: shippingAddress.address_line2 || '',
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.postal_code,
      billing_state: shippingAddress.state,
      billing_country: shippingAddress.country || 'India',
      billing_email: userEmail,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.payment_status === 'paid' ? 'Prepaid' : 'COD',
      shipping_charges: Number(order.shipping_cost) || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Number(order.subtotal) || 0,
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
      weight: dimensions.weight,
    };

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      request_payload: payload,
      status: 'pending',
    });

    const shipRocketResponse = await shipRocketClient.createOrder(payload);

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: shipRocketResponse.order_id.toString(),
        shiprocket_shipment_id: shipRocketResponse.shipment_id.toString(),
        shiprocket_status: shipRocketResponse.status,
        shiprocket_synced_at: new Date().toISOString(),
        order_status: 'confirmed',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order with ShipRocket details:', updateError);
    }

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      request_payload: payload,
      response_payload: shipRocketResponse,
      status: 'success',
    });

    if (shipRocketResponse.shipment_id) {
      await generateAWBForOrder(orderId, shipRocketResponse.shipment_id);
    }

    console.log(`ShipRocket order created successfully: ${shipRocketResponse.order_id}`);

    return {
      success: true,
      shiprocket_order_id: shipRocketResponse.order_id,
      shiprocket_shipment_id: shipRocketResponse.shipment_id,
    };
  } catch (error) {
    console.error('Error creating ShipRocket order:', error);

    const supabase = getSupabaseClient();
    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Generate AWB for shipment
 */
export async function generateAWBForOrder(orderId: string, shipmentId: number) {
  const supabase = getSupabaseClient();

  try {
    console.log(`Generating AWB for shipment: ${shipmentId}`);

    const awbResponse = await shipRocketClient.generateAWB({
      shipment_id: shipmentId,
    });

    const awbCode = awbResponse.response?.data?.awb_code || awbResponse.awb_code;
    const courierName = awbResponse.response?.data?.courier_name || awbResponse.courier_name;
    const courierId = awbResponse.response?.data?.courier_company_id || awbResponse.courier_company_id;

    if (!awbCode) {
      throw new Error('AWB code not generated');
    }

    await supabase
      .from('orders')
      .update({
        awb_number: awbCode,
        courier_name: courierName,
        courier_id: courierId?.toString(),
        order_status: 'processing',
      })
      .eq('id', orderId);

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'generate_awb',
      response_payload: awbResponse,
      status: 'success',
    });

    console.log(`AWB generated: ${awbCode}`);

    return { awb_code: awbCode, courier_name: courierName };
  } catch (error) {
    console.error('Error generating AWB:', error);

    const supabase = getSupabaseClient();
    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'generate_awb',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return null;
  }
}

/**
 * Schedule pickup for order
 */
export async function schedulePickupForOrder(orderId: string) {
  const supabase = getSupabaseClient();

  try {
    const { data: order } = await supabase
      .from('orders')
      .select('shiprocket_shipment_id')
      .eq('id', orderId)
      .single<{ shiprocket_shipment_id?: string }>();

    if (!order?.shiprocket_shipment_id) {
      throw new Error('Shipment ID not found');
    }

    const pickupResponse = await shipRocketClient.schedulePickup({
      shipment_id: [Number(order.shiprocket_shipment_id)],
    });

    await supabase
      .from('orders')
      .update({
        pickup_scheduled_date: new Date().toISOString(),
        order_status: 'ready_to_ship',
      })
      .eq('id', orderId);

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'schedule_pickup',
      response_payload: pickupResponse,
      status: 'success',
    });

    return pickupResponse;
  } catch (error) {
    console.error('Error scheduling pickup:', error);

    const supabase = getSupabaseClient();
    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'schedule_pickup',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}