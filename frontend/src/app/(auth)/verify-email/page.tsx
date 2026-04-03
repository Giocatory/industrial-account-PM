'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { authApi } from '@/lib/api';

const schema = z.object({ code: z.string().length(6, 'Введите 6-значный код') });

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ code }: { code: string }) => {
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, code });
      toast.success('Email подтверждён! Ожидайте активации аккаунта администратором.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <MailCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Подтверждение email</h2>
      <p className="text-sm text-gray-600 mb-6">
        Мы отправили 6-значный код на <span className="font-medium">{email}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...register('code')}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {loading ? 'Проверяем...' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
}
