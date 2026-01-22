// app/api/admin/fix-delivery-dates/route.ts
// Admin utility to fix missing delivery dates

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    console.log('🔍 Checking for orders with missing delivery dates...');

    // Find delivered orders without delivery date
    const { data: missingDates, error } = await supabase
      .from('orders')
      .select('id, order_number, order_status, created_at, updated_at, delivered_at, shipped_at')
      .eq('order_status', 'delivered')
      .is('delivered_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${missingDates?.length || 0} orders with missing delivery dates`);

    return NextResponse.json({
      success: true,
      count: missingDates?.length || 0,
      orders: missingDates || []
    });

  } catch (error: any) {
    console.error('❌ Error checking delivery dates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId, deliveryDate } = body;

    if (action === 'fix_single' && orderId) {
      // Fix a single order
      const updates: any = {
        delivered_at: deliveryDate || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Also set shipped_at if missing
      const { data: order } = await supabase
        .from('orders')
        .select('shipped_at')
        .eq('id', orderId)
        .single();

      if (order && !order.shipped_at) {
        updates.shipped_at = deliveryDate || new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Fixed delivery date for order ${data.order_number}`);

      return NextResponse.json({
        success: true,
        message: 'Delivery date updated successfully',
        order: data
      });
    }

    if (action === 'fix_all') {
      // Fix all orders with missing delivery dates
      console.log('🔧 Fixing all orders with missing delivery dates...');

      // Get all delivered orders without delivery date
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, updated_at, created_at, shipped_at')
        .eq('order_status', 'delivered')
        .is('delivered_at', null);

      if (fetchError) throw fetchError;

      if (!orders || orders.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No orders need fixing',
          fixed: 0
        });
      }

      // Update each order
      let fixed = 0;
      for (const order of orders) {
        const updates: any = {
          // Use updated_at as fallback, or created_at if updated_at is null
          delivered_at: order.updated_at || order.created_at,
          updated_at: new Date().toISOString()
        };

        // Also set shipped_at if missing
        if (!order.shipped_at) {
          updates.shipped_at = order.updated_at || order.created_at;
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', order.id);

        if (!updateError) {
          fixed++;
        } else {
          console.error(`Failed to fix order ${order.id}:`, updateError);
        }
      }

      console.log(`✅ Fixed ${fixed} orders`);

      return NextResponse.json({
        success: true,
        message: `Fixed ${fixed} orders`,
        fixed,
        total: orders.length
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Error fixing delivery dates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// Admin UI Component to use this API
// ========================================

/*
// Add this to your admin dashboard

import { useState } from 'react';

export function FixDeliveryDates() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fix-delivery-dates');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed to check orders');
    } finally {
      setLoading(false);
    }
  };

  const fixAllOrders = async () => {
    if (!confirm('Fix delivery dates for all affected orders?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/fix-delivery-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_all' })
      });
      const data = await res.json();
      setResult(data);
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert('Failed to fix orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-bold mb-4">Fix Missing Delivery Dates</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={checkOrders}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Orders'}
        </button>
        
        {result && result.count > 0 && (
          <button
            onClick={fixAllOrders}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Fixing...' : `Fix ${result.count} Orders`}
          </button>
        )}
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-semibold mb-2">
            {result.success ? '✅' : '❌'} {result.message || 'Results:'}
          </p>
          
          {result.count !== undefined && (
            <p className="text-sm text-gray-600">
              Found {result.count} orders with missing delivery dates
            </p>
          )}
          
          {result.fixed !== undefined && (
            <p className="text-sm text-gray-600">
              Fixed {result.fixed} out of {result.total} orders
            </p>
          )}

          {result.orders && result.orders.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Affected Orders:</p>
              <ul className="text-sm space-y-1">
                {result.orders.slice(0, 10).map((order: any) => (
                  <li key={order.id} className="text-gray-600">
                    #{order.order_number} - Created: {new Date(order.created_at).toLocaleDateString()}
                  </li>
                ))}
                {result.orders.length > 10 && (
                  <li className="text-gray-500 italic">
                    ...and {result.orders.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
*/