// app/api/admin/supabase-usage/route.ts
// Uses Supabase client directly to calculate usage

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Free tier limits
    const FREE_TIER_LIMITS = {
      storage: 500, // MB
      rows: 500000, // 500K rows (unlimited on free tier but good to track)
      bandwidth: 5, // GB per month (actually 5GB not 2GB)
      databaseSize: 500 // MB
    };

    // Get counts from all main tables
    const tables = ['products', 'orders', 'addresses', 'admin_users', 'admin_sessions'];
    
    let totalRows = 0;
    const tableCounts: Record<string, number> = {};

    // Fetch row counts for each table
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null) {
          tableCounts[table] = count;
          totalRows += count;
        } else {
          tableCounts[table] = 0;
        }
      } catch (err) {
        console.warn(`Could not fetch count for ${table}:`, err);
        tableCounts[table] = 0;
      }
    }

    // Get auth users count
    let usersCount = 0;
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      usersCount = users?.length || 0;
      totalRows += usersCount;
    } catch (err) {
      console.warn('Could not fetch users count:', err);
    }

    // Estimate storage (rough calculation: ~1KB per row average)
    const estimatedStorageMB = parseFloat(((totalRows * 1) / 1024).toFixed(2));

    // Calculate usage percentages
    const data = {
      rows: {
        used: totalRows,
        limit: FREE_TIER_LIMITS.rows,
        percentage: (totalRows / FREE_TIER_LIMITS.rows) * 100
      },
      storage: {
        used: estimatedStorageMB,
        limit: FREE_TIER_LIMITS.storage,
        percentage: (estimatedStorageMB / FREE_TIER_LIMITS.storage) * 100,
        unit: 'MB',
        note: 'Estimated based on row count (1KB/row avg)'
      },
      bandwidth: {
        used: 0, // Cannot be tracked via API on free tier
        limit: FREE_TIER_LIMITS.bandwidth,
        percentage: 0,
        unit: 'GB',
        note: 'Bandwidth usage not available via API. Check Supabase dashboard.'
      },
      tables: {
        ...tableCounts,
        auth_users: usersCount
      },
      breakdown: {
        products: tableCounts.products || 0,
        orders: tableCounts.orders || 0,
        addresses: tableCounts.addresses || 0,
        admins: tableCounts.admin_users || 0,
        users: usersCount
      },
      plan: 'free',
      lastUpdated: new Date().toISOString(),
      recommendations: [] as string[]
    };

    // Add recommendations based on usage
    if (data.rows.percentage > 80) {
      data.recommendations.push('⚠️ Database rows exceeding 80% - consider archiving old data');
    }
    if (data.storage.percentage > 80) {
      data.recommendations.push('⚠️ Storage usage high - optimize data storage');
    }
    if (totalRows > 100000) {
      data.recommendations.push('💡 Consider implementing data archival strategy');
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Supabase Usage Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch Supabase usage',
      data: {
        rows: { used: 0, limit: 500000 },
        storage: { used: 0, limit: 500 },
        bandwidth: { used: 0, limit: 5 },
        tables: {}
      }
    }, { status: 500 });
  }
}