// lib/shiprocket/orderService.ts - UPDATED WITH COD SUPPORT
import { createClient } from '@supabase/supabase-js';
import { shipRocketClient } from './client';
import {
  ShipRocketCreateOrderPayload,
  ShipRocketOrderItem,
} from './types';

// =====================
// Types
// =====================

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
  payment_method: string;   // ✅ NEW: 'razorpay' | 'cod'
  cod_charge: number;       // ✅ NEW: ₹100 for COD, 0 otherwise
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

// ✅ Lazy initialization
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
 * ✅ Resolve ShipRocket payment method explicitly from order.payment_method
 * Never rely on payment_status — a Razorpay order can be 'pending' too
 */
function resolveShipRocketPaymentMethod(order: Order): string {
  return order.payment_method === 'cod' ? 'COD' : 'Prepaid';
}

/**
 * Create ShipRocket order from Supabase order
 */
export async function createShipRocketOrder(orderId: string) {
  const supabase = getSupabaseClient();

  try {
    console.log(`🚀 Creating ShipRocket order for: ${orderId}`);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single<Order>();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.shiprocket_order_id) {
      console.log(`✅ Order already synced to ShipRocket: ${order.shiprocket_order_id}`);
      return {
        success: true,
        message: 'Order already synced',
        shiprocket_order_id: order.shiprocket_order_id,
      };
    }

    const shippingAddress = order.shipping_address;
    const items = order.items;

    if (!items || items.length === 0) {
      throw new Error('Order has no items');
    }

    if (!shippingAddress || !shippingAddress.first_name || !shippingAddress.phone) {
      throw new Error('Invalid shipping address');
    }

    const dimensions = await calculatePackageDimensions(items);
    const orderItems = await transformOrderItems(items);

    const { data: user } = await supabase.auth.admin.getUserById(order.user_id);
    const userEmail = user?.user?.email || 'customer@example.com';

    const formatStateName = (state: string): string => {
      return state
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // ✅ Resolve payment method explicitly — COD vs Prepaid
    const shipRocketPaymentMethod = resolveShipRocketPaymentMethod(order);

    // ✅ cod_charge goes to transaction_charges so ShipRocket knows the fee
    // For Prepaid orders this will be 0
    const codCharge = order.payment_method === 'cod' ? (order.cod_charge ?? 100) : 0;

    console.log(`💳 Payment method: ${shipRocketPaymentMethod}, COD charge: ₹${codCharge}`);

    const payload: ShipRocketCreateOrderPayload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_NAME || 'Primary',
      channel_id: '',
      comment: `Order from Magnus Kleid - ${order.order_number}`,
      billing_customer_name: shippingAddress.first_name,
      billing_last_name: shippingAddress.last_name || '',
      billing_address: shippingAddress.address_line1,
      billing_address_2: shippingAddress.address_line2 || '',
      billing_city: shippingAddress.city.toLowerCase(),
      billing_pincode: shippingAddress.postal_code,
      billing_state: formatStateName(shippingAddress.state),
      billing_country: shippingAddress.country || 'India',
      billing_email: userEmail,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: shipRocketPaymentMethod,    // ✅ 'COD' or 'Prepaid'
      shipping_charges: Number(order.shipping_cost) || 0,
      giftwrap_charges: 0,
      transaction_charges: codCharge,             // ✅ ₹100 for COD, 0 for Prepaid
      total_discount: 0,
      sub_total: Number(order.subtotal) || 0,
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
      weight: dimensions.weight,
    };

    console.log('📦 ShipRocket payload prepared:', JSON.stringify(payload, null, 2));

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      request_payload: payload,
      status: 'pending',
    });

    let shipRocketResponse;

    try {
      shipRocketResponse = await shipRocketClient.createOrder(payload);
      console.log('✅ ShipRocket API response received:', JSON.stringify(shipRocketResponse, null, 2));
    } catch (apiError: unknown) {
      const errorMsg = apiError instanceof Error ? apiError.message : JSON.stringify(apiError);

      await supabase.from('shiprocket_logs').insert({
        order_id: orderId,
        action: 'create_order_api_error',
        request_payload: payload,
        response_payload: apiError,
        status: 'error',
        error_message: `ShipRocket API call failed: ${errorMsg}`,
      });

      throw new Error(`ShipRocket API call failed: ${errorMsg}`);
    }

    if (!shipRocketResponse || typeof shipRocketResponse.order_id === 'undefined') {
      await supabase.from('shiprocket_logs').insert({
        order_id: orderId,
        action: 'create_order_failed',
        request_payload: payload,
        response_payload: shipRocketResponse,
        status: 'error',
        error_message: `ShipRocket returned invalid response. Full response: ${JSON.stringify(shipRocketResponse)}`,
      });

      throw new Error(`ShipRocket returned invalid response. Full response: ${JSON.stringify(shipRocketResponse)}`);
    }

    if (typeof shipRocketResponse.shipment_id === 'undefined') {
      await supabase.from('shiprocket_logs').insert({
        order_id: orderId,
        action: 'create_order_no_shipment',
        request_payload: payload,
        response_payload: shipRocketResponse,
        status: 'error',
        error_message: `ShipRocket returned order_id but no shipment_id. Response: ${JSON.stringify(shipRocketResponse)}`,
      });

      throw new Error(`ShipRocket returned order_id but no shipment_id. Response: ${JSON.stringify(shipRocketResponse)}`);
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: shipRocketResponse.order_id.toString(),
        shiprocket_shipment_id: shipRocketResponse.shipment_id.toString(),
        shiprocket_status: shipRocketResponse.status || 'created',
        shiprocket_synced_at: new Date().toISOString(),
        // ✅ Don't override order_status for COD — it's already 'confirmed'
        // Only set for Prepaid (was previously 'pending', now ShipRocket created)
        ...(order.payment_method !== 'cod' && { order_status: 'confirmed' }),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Failed to update order with ShipRocket details:', updateError);
    }

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      request_payload: payload,
      response_payload: shipRocketResponse,
      status: 'success',
    });

    if (shipRocketResponse.shipment_id) {
      console.log('🎫 Attempting to generate AWB...');
      try {
        await generateAWBForOrder(orderId, shipRocketResponse.shipment_id);
      } catch (awbError) {
        console.warn('⚠️ AWB generation failed (non-critical):', awbError);
      }
    }

    console.log(`✅ ShipRocket order created successfully: ${shipRocketResponse.order_id}`);

    return {
      success: true,
      shiprocket_order_id: shipRocketResponse.order_id,
      shiprocket_shipment_id: shipRocketResponse.shipment_id,
    };
  } catch (error) {
    console.error('❌ Error creating ShipRocket order:', error);

    const supabase = getSupabaseClient();

    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unknown error creating ShipRocket order';

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'create_order',
      status: 'error',
      error_message: errorMessage,
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
    console.log(`🎫 Generating AWB for shipment: ${shipmentId}`);

    const { data: order } = await supabase
      .from('orders')
      .select('shipping_address, awb_number')
      .eq('id', orderId)
      .single<{ shipping_address: ShippingAddress; awb_number?: string }>();

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.awb_number) {
      console.log(`✅ AWB already exists: ${order.awb_number}`);
      return { awb_code: order.awb_number, courier_name: 'Existing' };
    }

    console.log('📍 Checking courier availability...');

    let courierId: number | undefined;

    try {
      const couriers = await shipRocketClient.getAvailableCouriers(
        process.env.SHIPROCKET_PICKUP_PINCODE || '400084',
        order.shipping_address.postal_code,
        0.5,
        0
      );

      if (couriers.available_courier_companies && couriers.available_courier_companies.length > 0) {
        const sortedCouriers = couriers.available_courier_companies.sort((a, b) => a.rate - b.rate);
        courierId = sortedCouriers[0].courier_company_id;
        console.log(`✅ Selected courier: ${sortedCouriers[0].courier_name} (ID: ${courierId})`);
      } else {
        console.warn('⚠️ No couriers available, will try auto-assignment');
      }
    } catch (courierError) {
      console.warn('⚠️ Courier check failed, will try auto-assignment:', courierError);
    }

    const awbPayload = courierId
      ? { shipment_id: shipmentId, courier_id: courierId }
      : { shipment_id: shipmentId };

    const awbResponse = await shipRocketClient.generateAWB(awbPayload);

    console.log('✅ AWB API response:', awbResponse);

    const awbCode = awbResponse.response?.data?.awb_code || awbResponse.awb_code;
    const courierName = awbResponse.response?.data?.courier_name || awbResponse.courier_name;
    const assignedCourierId = awbResponse.response?.data?.courier_company_id || awbResponse.courier_company_id;

    if (!awbCode) {
      throw new Error('AWB code not generated by ShipRocket');
    }

    await supabase
      .from('orders')
      .update({
        awb_number: awbCode,
        courier_name: courierName || 'Unknown',
        courier_id: assignedCourierId?.toString() || null,
        order_status: 'processing',
      })
      .eq('id', orderId);

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'generate_awb',
      response_payload: awbResponse,
      status: 'success',
    });

    console.log(`✅ AWB generated: ${awbCode}`);

    return { awb_code: awbCode, courier_name: courierName };
  } catch (error) {
    console.error('❌ Error generating AWB:', error);

    const supabase = getSupabaseClient();

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error generating AWB';

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'generate_awb',
      status: 'error',
      error_message: errorMessage,
    });

    console.warn('⚠️ AWB generation failed, can be retried manually');
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
    console.error('❌ Error scheduling pickup:', error);

    const supabase = getSupabaseClient();

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error scheduling pickup';

    await supabase.from('shiprocket_logs').insert({
      order_id: orderId,
      action: 'schedule_pickup',
      status: 'error',
      error_message: errorMessage,
    });

    throw error;
  }
}