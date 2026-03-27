// app/api/admin/hero-videos/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hero_videos')
      .select('*')
      .order('gender', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('GET hero-videos error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hero videos' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as {
      gender: 'Male' | 'Female';
      // video/poster upload
      type?: 'video' | 'poster';
      url?: string;
      // mode toggle
      mode?: 'video' | 'carousel';
      // carousel images replace
      carousel_images?: string[];
    };

    const { gender } = body;
    if (!gender) {
      return NextResponse.json({ success: false, error: 'gender is required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('hero_videos')
      .select('id, version')
      .eq('gender', gender)
      .single();

    // Build update payload
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.type && body.url) {
      const field = body.type === 'video' ? 'video_url' : 'poster_url';
      updates[field] = body.url;
      updates['version'] = (existing?.version ?? 0) + 1;
    }

    if (body.mode !== undefined) {
      updates['mode'] = body.mode;
    }

    if (body.carousel_images !== undefined) {
      updates['carousel_images'] = body.carousel_images;
      updates['version'] = (existing?.version ?? 0) + 1;
    }

    if (existing) {
      const { error } = await supabase
        .from('hero_videos')
        .update(updates)
        .eq('gender', gender);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('hero_videos')
        .insert({ gender, ...updates, version: 1 });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT hero-videos error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update hero video' }, { status: 500 });
  }
}