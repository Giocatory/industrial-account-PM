'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  lastName: z.string().min(2, 'Обязательное поле'),
  firstName: z.string().min(2, 'Обязательное поле'),
  middleName: z.string().optional(),
  organization: z.string().min(2, 'Обязательное поле'),
  position: z.string().min(2, 'Обязательное поле'),
  phone: z.string().min(7, 'Введите телефон'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      toast.success('Регистрация успешна! Проверьте email.');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, required = true }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[name as keyof FormData] && (
        <p className="text-red-500 text-xs mt-1">{(errors as any)[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Регистрация</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field name="lastName" label="Фамилия" placeholder="Иванов" />
          <Field name="firstName" label="Имя" placeholder="Иван" />
        </div>
        <Field name="middleName" label="Отчество" placeholder="Иванович" required={false} />
        <Field name="organization" label="Организация" placeholder="ООО Промтех" />
        <Field name="position" label="Должность" placeholder="Инженер" />
        <Field name="phone" label="Телефон" placeholder="+7 999 123-45-67" />
        <Field name="email" label="Email" type="email" placeholder="user@example.com" />
        <Field name="password" label="Пароль" type="password" placeholder="Минимум 8 символов" />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium text-sm transition-colors mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">Войти</Link>
      </p>
    </div>
  );
}
