'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit2, Save, X, CheckCircle, XCircle, Ban, Shield,
} from 'lucide-react';
import {
  cn, USER_STATUS_LABELS, USER_STATUS_COLORS, formatDateTime,
} from '@/lib/utils';
import { useAuthStore, UserRole, ROLE_LABELS } from '@/store/auth.store';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { user: currentUser } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [roleConfirm, setRoleConfirm] = useState<UserRole | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', params.id],
    queryFn: () => usersApi.getOne(params.id).then(r => r.data),
  });

  const form = useForm({ values: user });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(params.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', params.id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Данные обновлены');
      setEditing(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const approveMutation = useMutation({
    mutationFn: () => usersApi.approve(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user', params.id] }); toast.success('Подтверждён'); },
  });
  const rejectMutation = useMutation({
    mutationFn: () => usersApi.reject(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user', params.id] }); toast.success('Отклонён'); },
  });
  const blockMutation = useMutation({
    mutationFn: () => usersApi.block(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user', params.id] }); toast.success('Заблокирован'); },
  });
  const roleMutation = useMutation({
    mutationFn: (role: UserRole) => usersApi.changeRole(params.id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', params.id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Роль изменена');
      setRoleConfirm(null);
    },
  });

  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="h-64 bg-gray-100 rounded-xl" /></div>;
  if (!user) return <div className="p-6 text-gray-500">Пользователь не найден</div>;

  const isAdmin = currentUser?.role === 'admin';

  const Field = ({ label, name, editable = true }: { label: string; name: string; editable?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {editing && editable ? (
        <input
          {...form.register(name)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm text-gray-900">{(user as any)[name] || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/users" className="text-gray-400 hover:text-blue-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Карточка пользователя</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: avatar + status actions */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <p className="font-semibold text-gray-900">{user.lastName} {user.firstName}</p>
            <p className="text-sm text-gray-500 mb-2">{user.position || '—'}</p>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', USER_STATUS_COLORS[user.status])}>
              {USER_STATUS_LABELS[user.status]}
            </span>
            <div className="mt-3">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {ROLE_LABELS[user.role as UserRole]}
              </span>
            </div>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Действия</p>
              {user.status === 'pending' && (
                <>
                  <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors">
                    <CheckCircle className="w-4 h-4" /> Подтвердить
                  </button>
                  <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors">
                    <XCircle className="w-4 h-4" /> Отклонить
                  </button>
                </>
              )}
              {user.status === 'active' && (
                <button onClick={() => blockMutation.mutate()} disabled={blockMutation.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium transition-colors">
                  <Ban className="w-4 h-4" /> Заблокировать
                </button>
              )}

              {/* Role change with confirmation */}
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">Изменить роль:</p>
                {roleConfirm ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-yellow-800">Назначить роль <strong>{ROLE_LABELS[roleConfirm]}</strong>?</p>
                    <div className="flex gap-2">
                      <button onClick={() => roleMutation.mutate(roleConfirm)}
                        className="flex-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1.5 rounded">
                        Подтвердить
                      </button>
                      <button onClick={() => setRoleConfirm(null)}
                        className="flex-1 text-xs border px-2 py-1.5 rounded hover:bg-gray-50">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={user.role}
                    onChange={e => setRoleConfirm(e.target.value as UserRole)}
                    className="w-full border border-gray-300 rounded-lg text-xs px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ROLE_LABELS as Record<string, string>).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Зарегистрирован</p>
            <p className="text-sm font-medium">{formatDateTime(user.createdAt)}</p>
            <p className="text-xs text-gray-500 mt-2">Обновлён</p>
            <p className="text-sm font-medium">{formatDateTime(user.updatedAt)}</p>
          </div>
        </div>

        {/* Right: details with edit */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Личные данные</h3>
              {isAdmin && (
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button onClick={form.handleSubmit(d => updateMutation.mutate(d))}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                        <Save className="w-4 h-4" />
                        {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50">
                        <X className="w-4 h-4" /> Отмена
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50">
                      <Edit2 className="w-4 h-4" /> Редактировать
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              <Field label="Фамилия" name="lastName" />
              <Field label="Имя" name="firstName" />
              <Field label="Отчество" name="middleName" />
              <Field label="Email" name="email" editable={false} />
              <Field label="Организация" name="organization" />
              <Field label="Должность" name="position" />
              <Field label="Телефон" name="phone" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email подтверждён</label>
                <p className={cn('text-sm font-medium', user.emailVerified ? 'text-green-600' : 'text-red-500')}>
                  {user.emailVerified ? '✓ Да' : '✗ Нет'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
