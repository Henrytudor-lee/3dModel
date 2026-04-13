import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase, ModelUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { userId: string };
    } catch {
      return NextResponse.json({ user: null });
    }

    if (!supabase) {
      return NextResponse.json({ user: null });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('ModelUsers')
      .select('id, email, display_name, avatar_url, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
