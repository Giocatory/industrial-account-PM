'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Building, Mail, Phone } from 'lucide-react';
import { cn, USER_STATUS_COLORS, USER_STATUS_LABELS, formatDate } from '@/lib/utils';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'lastName' | 'organization' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page, sortBy, sortDir],
    queryFn: () => clientsApi.getAll({ search, page, limit: 20, sortBy, sortDir }).then(r => r.data),
  });

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Клиенты</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Поиск клиентов..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Сортировка:</span>
        {(['lastName','organization','createdAt'] as const).map(f => (
          <button key={f} onClick={() => { if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(f); setSortDir('asc'); } }}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${sortBy === f ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'}`}>
            {f === 'lastName' ? 'Фамилия' : f === 'organization' ? 'Организация' : 'Дата'} {sortBy === f ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />) :
          data?.data?.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.lastName} {client.firstName}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', USER_STATUS_COLORS[client.status])}>
                      {USER_STATUS_LABELS[client.status]}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {client.organization && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Building className="w-3 h-3" />{client.organization}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3 h-3" />{client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />{client.phone}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">Зарегистрирован: {formatDate(client.createdAt)}</p>
              </div>
            </Link>
          ))}
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(data.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={cn('w-9 h-9 rounded-lg text-sm font-medium', page === i + 1 ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50')}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
