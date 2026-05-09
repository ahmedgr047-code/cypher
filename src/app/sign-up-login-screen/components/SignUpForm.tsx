'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const passwordValue = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: signData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: data.fullName.trim() },
      },
    });

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return;
    }

    if (signData.user && !signData.session) {
      toast.success('تحقق من بريدك لتأكيد الحساب', {
        description: 'بعد التأكيد يمكنك تسجيل الدخول',
      });
      setIsLoading(false);
      onSwitchToLogin();
      return;
    }

    toast.success('تم إنشاء الحساب بنجاح! 🎉', {
      description: `مرحباً ${data.fullName}`,
    });
    setIsLoading(false);
    router.push('/chat-interface');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">الاسم الكامل</label>
        <input
          {...register('fullName', {
            required: 'الاسم الكامل مطلوب',
            minLength: { value: 3, message: 'الاسم يجب أن يكون 3 أحرف على الأقل' },
          })}
          type="text"
          placeholder="أحمد محمد القحطاني"
          className="input-field w-full px-4 py-3 text-sm placeholder-muted-foreground"
        />
        {errors.fullName && <p className="text-primary text-xs mt-1">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">البريد الإلكتروني</label>
        <input
          {...register('email', {
            required: 'البريد الإلكتروني مطلوب',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'صيغة البريد الإلكتروني غير صحيحة',
            },
          })}
          type="email"
          placeholder="example@shumukh.edu.sa"
          className="input-field w-full px-4 py-3 text-sm placeholder-muted-foreground"
          dir="ltr"
        />
        {errors.email && <p className="text-primary text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">كلمة المرور</label>
        <p className="text-xs text-muted-foreground">8 أحرف على الأقل، تضمّن رقماً وحرفاً كبيراً</p>
        <div className="relative">
          <input
            {...register('password', {
              required: 'كلمة المرور مطلوبة',
              minLength: { value: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
              pattern: {
                value: /^(?=.*[A-Z])(?=.*[0-9])/,
                message: 'يجب أن تحتوي على حرف كبير ورقم على الأقل',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="input-field w-full px-4 py-3 text-sm pr-12"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-primary text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
        <div className="relative">
          <input
            {...register('confirmPassword', {
              required: 'تأكيد كلمة المرور مطلوب',
              validate: (value) => value === passwordValue || 'كلمتا المرور غير متطابقتين',
            })}
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            className="input-field w-full px-4 py-3 text-sm pr-12"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-primary text-xs mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        بالتسجيل، أنت توافق على{' '}
        <span className="text-primary cursor-pointer hover:underline">شروط الاستخدام</span>
        {' '}و{' '}
        <span className="text-primary cursor-pointer hover:underline">سياسة الخصوصية</span>
      </p>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
        style={{ minHeight: '48px' }}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <UserPlus size={16} />
            إنشاء الحساب
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:text-accent font-medium transition-colors duration-150"
        >
          تسجيل الدخول
        </button>
      </p>
    </form>
  );
}
