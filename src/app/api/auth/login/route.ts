import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json(
        { error: 'فشل تسجيل الدخول: ' + error.message },
        { status: 401 }
      );
    }

    // Create or update user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }
    }

    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0],
      }
    });

  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
