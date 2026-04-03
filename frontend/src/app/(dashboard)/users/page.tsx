'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, Ban } from 'lucide-react';
import { cn, USER_STATUS_LABELS, USER_STATUS_COLORS, formatDate } from '@/lib/utils';
import { ROLE_LABELS, type UserRole } from '@/store/auth.store';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortDir('ASC'); }
  };
  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortBy === field ? (sortDir === 'ASC' ? '↑' : '↓') : '↕'}</span>
  );

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, status, role, page, sortBy, sortDir],
    queryFn: () => usersApi.getAll({ search, status: status || undefined, role: role || undefined, page, limit: 20, sortBy, sortDir }).then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Пользователь подтверждён'); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => usersApi.reject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Пользователь отклонён'); },
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => usersApi.block(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Пользователь заблокирован'); },
  });

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Пользователи</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по имени, email, организации..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Все статусы</option>
          {Object.entries(USER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Все роли</option>
          {Object.entries(ROLE_LABELS as Record<string, string>).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("lastName")}>Пользователь<SortIcon field="lastName" /></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Организация</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>Регистрация<SortIcon field="createdAt" /></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.data?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a href={`/users/${u.id}`} className="hover:text-blue-600">
                      <div className="font-medium">{u.lastName} {u.firstName}</div>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.organization || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {ROLE_LABELS[u.role as UserRole]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-1 rounded-full', USER_STATUS_COLORS[u.status])}>
                      {USER_STATUS_LABELS[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {u.status === 'pending' && (
                        <>
                          <button onClick={() => approveMutation.mutate(u.id)}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Подтвердить">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => rejectMutation.mutate(u.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Отклонить">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {u.status === 'active' && (
                        <button onClick={() => blockMutation.mutate(u.id)}
                          className="p-1.5 rounded hover:bg-orange-50 text-orange-500" title="Заблокировать">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <p className="text-sm text-gray-500">Всего: {data.total}</p>
            <div className="flex gap-1">
              {[...Array(data.pages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={cn('w-8 h-8 rounded text-sm', page === i + 1 ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50')}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
