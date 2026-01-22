// app/api/admin/exchanges/route.ts - SIMPLIFIED (NO PAYMENT/REFUND)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ==========================================
// GET - FETCH ALL EXCHANGES (ADMIN)
// ==========================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const limit = searchParams.get('limit');

    console.log('📦 Admin: Fetching exchanges', { status, userId, orderId });

    // Get exchanges
    let query = supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: exchanges, error: exchangeError } = await query;

    if (exchangeError) {
      console.error('❌ Fetch exchanges error:', exchangeError);
      throw exchangeError;
    }

    console.log(`✅ Found ${exchanges?.length || 0} raw exchanges`);

    if (!exchanges || exchanges.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Enrich with order data
    const enrichedExchanges = await Promise.all(
      exchanges.map(async (exchange) => {
        try {
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('order_number, user_id, shipping_address')
            .eq('id', exchange.order_id)
            .single();

          const shippingAddress = order?.shipping_address || {};
          const customerName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || 'N/A';
          const customerEmail = shippingAddress.email || 'N/A';

          return {
            ...exchange,
            order_number: order?.order_number || exchange.order_number || 'N/A',
            customer_name: customerName,
            customer_email: customerEmail
          };
        } catch (error) {
          console.error(`❌ Error enriching exchange ${exchange.id}:`, error);
          return {
            ...exchange,
            order_number: exchange.order_number || 'N/A',
            customer_name: 'N/A',
            customer_email: 'N/A'
          };
        }
      })
    );

    console.log('✅ Successfully enriched exchanges');

    return NextResponse.json({
      success: true,
      data: enrichedExchanges
    });

  } catch (error: any) {
    console.error('❌ Admin Get Exchanges Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT - UPDATE EXCHANGE STATUS (ADMIN)
// ==========================================

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      status, 
      admin_notes, 
      tracking_number,
      rejection_reason
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exchange ID required' },
        { status: 400 }
      );
    }

    console.log('✏️ Admin: Updating exchange', { id, status });

    // Get current exchange
    const { data: currentExchange, error: fetchError } = await supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentExchange) {
      console.error('❌ Exchange not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Exchange not found' },
        { status: 404 }
      );
    }

    // Build updates
    const updates: any = { 
      updated_at: new Date().toISOString() 
    };

    if (status) {
      updates.status = status;

      switch (status) {
        case 'approved':
          updates.approved_at = new Date().toISOString();
          break;
        case 'rejected':
          updates.rejected_at = new Date().toISOString();
          if (rejection_reason) updates.rejection_reason = rejection_reason;
          break;
        case 'shipped':
          updates.shipped_at = new Date().toISOString();
          if (tracking_number) updates.tracking_number = tracking_number;
          break;
        case 'completed':
          updates.completed_at = new Date().toISOString();
          break;
      }
    }

    if (admin_notes) updates.admin_notes = admin_notes;
    if (tracking_number) updates.tracking_number = tracking_number;

    // Validation
    if (status === 'rejected' && !rejection_reason && !admin_notes) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason or admin notes required when rejecting' },
        { status: 400 }
      );
    }

    if (status === 'shipped' && !updates.tracking_number && !currentExchange.tracking_number) {
      return NextResponse.json(
        { success: false, error: 'Tracking number required when marking as shipped' },
        { status: 400 }
      );
    }

    // Update exchange
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('exchange_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log('✅ Exchange updated successfully');

    return NextResponse.json({
      success: true,
      data: updated,
      message: getSuccessMessage(status)
    });

  } catch (error: any) {
    console.error('❌ Admin Update Exchange Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE - CANCEL EXCHANGE (ADMIN)
// ==========================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exchange ID required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Admin: Cancelling exchange', { id, reason });

    const { data: exchange } = await supabaseAdmin
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!exchange) {
      return NextResponse.json(
        { success: false, error: 'Exchange not found' },
        { status: 404 }
      );
    }

    if (!['pending', 'approved'].includes(exchange.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel exchange with status: ${exchange.status}` },
        { status: 400 }
      );
    }

    const { data: cancelled, error } = await supabaseAdmin
      .from('exchange_requests')
      .update({
        status: 'cancelled',
        admin_notes: reason || 'Cancelled by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Exchange cancelled successfully');

    return NextResponse.json({
      success: true,
      message: 'Exchange cancelled successfully'
    });

  } catch (error: any) {
    console.error('❌ Admin Cancel Exchange Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getSuccessMessage(status?: string): string {
  if (!status) return 'Exchange updated successfully';

  switch (status) {
    case 'approved':
      return 'Exchange approved successfully. Ready to ship.';
    case 'rejected':
      return 'Exchange rejected. Customer will be notified.';
    case 'shipped':
      return 'Exchange marked as shipped. Customer will receive tracking details.';
    case 'completed':
      return 'Exchange completed successfully.';
    default:
      return 'Exchange updated successfully';
  }
}