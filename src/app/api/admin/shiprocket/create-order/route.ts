// app/api/admin/shiprocket/create-order/route.ts - FIXED FOR BUILD
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createShipRocketOrder, generateAWBForOrder, schedulePickupForOrder } from '@/lib/shiprocket/orderService';

// ✅ FIX: Lazy initialization
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient(); // ✅ Create client here

  try {
    const { orderId, action = 'create' } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check here
    // const isAdmin = await verifyAdminSession(req);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    let result;

    switch (action) {
      case 'create':
        result = await createShipRocketOrder(orderId);
        break;

      case 'generate_awb':
        const { data: order } = await supabase
          .from('orders')
          .select('shiprocket_shipment_id')
          .eq('id', orderId)
          .single();

        if (!order?.shiprocket_shipment_id) {
          return NextResponse.json(
            { error: 'Shipment ID not found. Create order first.' },
            { status: 400 }
          );
        }

        result = await generateAWBForOrder(orderId, Number(order.shiprocket_shipment_id));
        break;

      case 'schedule_pickup':
        result = await schedulePickupForOrder(orderId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Admin ShipRocket API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}