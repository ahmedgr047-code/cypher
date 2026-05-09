'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onForgotPassword, onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      setIsLoading(false);
      setError('root', {
        message: error.message.includes('Invalid login')
          ? 'بيانات الدخول غير صحيحة'
          : error.message,
      });
      return;
    }

    toast.success('تم تسجيل الدخول بنجاح');
    setIsLoading(false);
    router.push('/chat-interface');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {errors.root && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-3 flex items-start gap-2">
          <span className="text-primary mt-0.5 text-sm">⚠</span>
          <p className="text-red-300 text-sm">{errors.root.message}</p>
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">كلمة المرور</label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-primary hover:text-accent transition-colors duration-150"
          >
            نسيت كلمة المرور؟
          </button>
        </div>
        <div className="relative">
          <input
            {...register('password', {
              required: 'كلمة المرور مطلوبة',
              minLength: { value: 6, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
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

      <div className="flex items-center gap-2">
        <input
          {...register('rememberMe')}
          type="checkbox"
          id="rememberMe"
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
        <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
          تذكرني
        </label>
      </div>

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
            <LogIn size={16} />
            تسجيل الدخول
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-primary hover:text-accent font-medium transition-colors duration-150"
        >
          سجّل الآن
        </button>
      </p>
    </form>
  );
}
