'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

const emailSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<{ email: string }>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<{ code: string; newPassword: string }>({ resolver: zodResolver(resetSchema) });

  const sendCode = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data);
      setEmail(data.email);
      setStep('reset');
      toast.success('Код отправлен на email');
    } catch {
      toast.error('Ошибка отправки кода');
    } finally { setLoading(false); }
  };

  const resetPassword = async (data: { code: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ email, ...data });
      toast.success('Пароль изменён');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Неверный код');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {step === 'email' ? 'Восстановление пароля' : 'Новый пароль'}
      </h2>

      {step === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(sendCode)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...emailForm.register('email')}
              type="email"
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm"
          >
            {loading ? 'Отправляем...' : 'Отправить код'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Код из письма</label>
            <input
              {...resetForm.register('code')}
              maxLength={6} inputMode="numeric"
              placeholder="000000"
              className="w-full px-3 py-3 text-center text-xl tracking-widest font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input
              {...resetForm.register('newPassword')}
              type="password" placeholder="Минимум 8 символов"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm"
          >
            {loading ? 'Сохраняем...' : 'Сохранить пароль'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600 mt-6">
        <Link href="/login" className="text-blue-600 hover:underline">← Назад ко входу</Link>
      </p>
    </div>
  );
}
