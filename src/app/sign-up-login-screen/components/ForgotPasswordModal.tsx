'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface ForgotFormData {
  email: string;
}

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotFormData>();

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/chat-interface`,
    });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('تم إرسال رابط الاستعادة', {
      description: `تحقق من بريدك الإلكتروني: ${data.email}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-backdrop">
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl fade-in relative"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 btn-ghost p-1.5 rounded-lg"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        {!sent ? (
          <>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">استعادة كلمة المرور</h2>
              <p className="text-sm text-muted-foreground">
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  البريد الإلكتروني
                </label>
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
                {errors.email && (
                  <p className="text-primary text-xs mt-1">{errors.email.message}</p>
                )}
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
                  'إرسال رابط الاستعادة'
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                إلغاء
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-950 border border-green-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">تم الإرسال!</h2>
            <p className="text-sm text-muted-foreground mb-1">
              أرسلنا رابط استعادة كلمة المرور إلى
            </p>
            <p className="text-sm text-primary font-mono-data mb-6" dir="ltr">
              {emailValue}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              تحقق من مجلد البريد غير المرغوب إذا لم تجد الرسالة
            </p>
            <button
              onClick={onClose}
              className="btn-primary px-8 py-2.5 text-sm mx-auto"
            >
              حسناً
            </button>
          </div>
        )}
      </div>
    </div>
  );
}