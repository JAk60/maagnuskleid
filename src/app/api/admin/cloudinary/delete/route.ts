// app/api/cloudinary/delete/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary credentials not configured');
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 500 }
      );
    }

    // Generate signature for deletion
    const timestamp = Math.round(Date.now() / 1000);
    const crypto = require('crypto');
    
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    // Delete from Cloudinary
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    if (result.result === 'ok') {
      console.log('✅ Deleted from Cloudinary:', publicId);
      return NextResponse.json({ success: true, result });
    } else {
      console.warn('⚠️ Cloudinary deletion response:', result);
      return NextResponse.json({ success: false, result });
    }

  } catch (error: any) {
    console.error('❌ Cloudinary delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete from Cloudinary' },
      { status: 500 }
    );
  }
}