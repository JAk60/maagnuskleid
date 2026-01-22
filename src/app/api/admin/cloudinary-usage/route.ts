// app/api/admin/cloudinary-usage/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📊 Cloudinary Usage API called');

    // Check if credentials are configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    console.log('Cloudinary config check:', {
      cloudName: cloudName ? '✓ Set' : '✗ Missing',
      apiKey: apiKey ? '✓ Set' : '✗ Missing',
      apiSecret: apiSecret ? '✓ Set' : '✗ Missing'
    });

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️ Cloudinary credentials not configured');
      return NextResponse.json({
        success: true,
        message: 'Cloudinary not configured. Add credentials to .env.local',
        data: {
          images: { used: 0, limit: 25000 },
          storage: { used: 0, limit: 25 },
          bandwidth: { used: 0, limit: 25 },
          transformations: { used: 0, limit: 25000 }
        }
      });
    }

    // Use Cloudinary Admin API
    // Note: We need to use Basic Auth
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    console.log('Calling Cloudinary API...');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary API error:', response.status, errorText);
      throw new Error(`Cloudinary API returned ${response.status}: ${errorText}`);
    }

    const usage = await response.json();
    console.log('✅ Cloudinary API response received');

    // Free tier limits
    const FREE_TIER_LIMITS = {
      credits: 25,
      storage: 25, // GB
      bandwidth: 25, // GB per month
      transformations: 25000,
      images: 25000
    };

    // Calculate usage
    const storageUsedGB = (usage.storage?.usage || 0) / (1024 * 1024 * 1024);
    const bandwidthUsedGB = (usage.bandwidth?.usage || 0) / (1024 * 1024 * 1024);
    
    const data = {
      images: {
        used: usage.resources || 0,
        limit: FREE_TIER_LIMITS.images,
        percentage: ((usage.resources || 0) / FREE_TIER_LIMITS.images) * 100
      },
      storage: {
        used: parseFloat(storageUsedGB.toFixed(2)),
        limit: FREE_TIER_LIMITS.storage,
        percentage: (storageUsedGB / FREE_TIER_LIMITS.storage) * 100
      },
      bandwidth: {
        used: parseFloat(bandwidthUsedGB.toFixed(2)),
        limit: FREE_TIER_LIMITS.bandwidth,
        percentage: (bandwidthUsedGB / FREE_TIER_LIMITS.bandwidth) * 100
      },
      transformations: {
        used: usage.transformations?.usage || 0,
        limit: FREE_TIER_LIMITS.transformations,
        percentage: ((usage.transformations?.usage || 0) / FREE_TIER_LIMITS.transformations) * 100
      },
      plan: usage.plan || 'free',
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Cloudinary usage calculated:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Cloudinary Usage API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Cloudinary usage';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        data: {
          images: { used: 0, limit: 25000 },
          storage: { used: 0, limit: 25 },
          bandwidth: { used: 0, limit: 25 },
          transformations: { used: 0, limit: 25000 }
        }
      },
      { status: 200 } // Return 200 even on error so dashboard doesn't break
    );
  }
}