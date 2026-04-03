'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, documentsApi } from '@/lib/api';
import { useAuthStore, ROLE_LABELS } from '@/store/auth.store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Lock, Save, Eye, EyeOff, Camera } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  organization: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Пароли не совпадают', path: ['confirmPassword'] });

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', 'avatar');
      const { data: doc } = await documentsApi.upload(fd);
      return usersApi.update(user!.id, { avatar: doc.s3Url });
    },
    onSuccess: (res) => { setUser(res.data); toast.success('Аватар обновлён'); },
    onError: () => toast.error('Ошибка загрузки аватара'),
  });

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    middleName: user?.middleName || '',
    organization: user?.organization || '',
    position: user?.position || '',
    phone: user?.phone || '',
  }});

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(user!.id, data),
    onSuccess: (res) => { setUser(res.data); toast.success('Профиль обновлён'); },
    onError: () => toast.error('Ошибка обновления'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => usersApi.changePassword(data),
    onSuccess: () => { toast.success('Пароль изменён'); passwordForm.reset(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка смены пароля'),
  });

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      {/* Avatar & Role badge */}
      <div className="bg-white border rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <>{user.firstName[0]}{user.lastName[0]}</>
            )}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Изменить фото"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); }} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user.lastName} {user.firstName} {user.middleName}</h2>
          <p className="text-sm text-gray-500">{user.organization}</p>
          <span className="mt-2 inline-block text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5">
        {([['profile', 'Личные данные', User], ['password', 'Смена пароля', Lock]] as any[]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(d => updateMutation.mutate(d))} className="bg-white border rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['lastName', 'Фамилия'], ['firstName', 'Имя']].map(([name, label]) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input {...profileForm.register(name as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          {[['middleName', 'Отчество'], ['organization', 'Организация'], ['position', 'Должность'], ['phone', 'Телефон']].map(([name, label]) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input {...profileForm.register(name as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user.email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <button type="submit" disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="bg-white border rounded-xl p-6 space-y-4">
          {[
            ['currentPassword', 'Текущий пароль', showCurrent, () => setShowCurrent(!showCurrent)],
            ['newPassword', 'Новый пароль', showNew, () => setShowNew(!showNew)],
            ['confirmPassword', 'Повторите новый пароль', showNew, () => setShowNew(!showNew)],
          ].map(([name, label, show, toggle]: any) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input {...passwordForm.register(name)} type={show ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(passwordForm.formState.errors as any)[name] && (
                <p className="text-red-500 text-xs mt-1">{(passwordForm.formState.errors as any)[name]?.message}</p>
              )}
            </div>
          ))}
          <button type="submit" disabled={passwordMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
            <Lock className="w-4 h-4" />
            {passwordMutation.isPending ? 'Изменение...' : 'Изменить пароль'}
          </button>
        </form>
      )}
    </div>
  );
}
