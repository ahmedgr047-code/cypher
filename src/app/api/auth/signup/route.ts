import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: 'فشل إنشاء الحساب: ' + error.message },
        { status: 400 }
      );
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return NextResponse.json(
          { error: 'تم إنشاء الحساب ولكن فشل حفظ الملف الشخصي' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: fullName,
      }
    });

  } catch (error) {
    console.error('Signup route error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
