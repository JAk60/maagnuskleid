// app/api/webhooks/shiprocket/route.ts - FIXED FOR BUILD
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
 * Map ShipRocket status to our order status
 */
function mapShipRocketStatus(shipRocketStatus: string): string {
  const statusMap: Record<string, string> = {
    'PICKUP SCHEDULED': 'ready_to_ship',
    'PICKED UP': 'shipped',
    'IN TRANSIT': 'shipped',
    'OUT FOR DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'RTO IN TRANSIT': 'return_in_transit',
    'RTO DELIVERED': 'returned',
    'CANCELLED': 'cancelled',
    'LOST': 'lost',
    'DAMAGED': 'damaged',
  };

  return statusMap[shipRocketStatus.toUpperCase()] || 'processing';
}

/**
 * Handle shipment status updates
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient(); // ✅ Create client here

  try {
    const payload = await req.json();
    console.log('ShipRocket webhook received:', payload);

    const {
      order_id,
      awb,
      courier_name,
      current_status,
      shipment_status,
      edd,
      scans = [],
    } = payload;

    // Find order by order_number or AWB
    let order;
    
    if (order_id) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', order_id)
        .single();
      order = data;
    }
    
    if (!order && awb) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('awb_number', awb)
        .single();
      order = data;
    }

    if (!order) {
      console.error('Order not found for webhook:', { order_id, awb });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Map status
    const newStatus = mapShipRocketStatus(current_status || shipment_status);

    // Prepare update data
    const updateData: any = {
      shiprocket_status: current_status || shipment_status,
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Update specific timestamps based on status
    if (newStatus === 'shipped' && !order.shipped_at) {
      updateData.shipped_at = new Date().toISOString();
    }

    if (newStatus === 'delivered' && !order.delivered_at) {
      updateData.delivered_at = new Date().toISOString();
    }

    if (edd) {
      updateData.expected_delivery_date = new Date(edd).toISOString();
    }

    if (awb && !order.awb_number) {
      updateData.awb_number = awb;
    }

    if (courier_name && !order.courier_name) {
      updateData.courier_name = courier_name;
    }

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Log webhook
    await supabase.from('shiprocket_logs').insert({
      order_id: order.id,
      action: 'webhook_received',
      request_payload: payload,
      status: 'success',
    });

    console.log(`Order ${order.order_number} updated to status: ${newStatus}`);

    return NextResponse.json({ 
      success: true,
      order_id: order.id,
      new_status: newStatus
    });

  } catch (error: any) {
    console.error('ShipRocket webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}