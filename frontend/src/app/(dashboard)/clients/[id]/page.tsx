'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building, FolderKanban } from 'lucide-react';
import { cn, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, USER_STATUS_COLORS, USER_STATUS_LABELS, formatDate } from '@/lib/utils';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', params.id],
    queryFn: () => clientsApi.getOne(params.id).then(r => r.data),
  });

  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="h-48 bg-gray-100 rounded-xl" /></div>;
  if (!client) return <div className="p-6 text-gray-500">Клиент не найден</div>;

  return (
    <div className="p-6 space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" /> Назад к клиентам
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
              {client.firstName?.[0]}{client.lastName?.[0]}
            </div>
            <div>
              <h1 className="font-bold text-lg">{client.lastName} {client.firstName} {client.middleName}</h1>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', USER_STATUS_COLORS[client.status])}>
                {USER_STATUS_LABELS[client.status]}
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {client.position && <div className="text-gray-600">{client.position}</div>}
            {client.organization && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="w-4 h-4 text-gray-400" />{client.organization}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${client.email}`} className="hover:text-blue-600">{client.email}</a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
              </div>
            )}
            <div className="pt-2 border-t text-gray-400 text-xs">Регистрация: {formatDate(client.createdAt)}</div>
          </div>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" /> Проекты клиента ({client.projects?.length || 0})
          </h2>
          {client.projects?.length === 0 && <div className="text-gray-500 text-sm">Проектов нет</div>}
          {client.projects?.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-medium text-gray-900">{project.title}</p>
                  <span className={cn('shrink-0 text-xs px-2 py-1 rounded-full', PROJECT_STATUS_COLORS[project.status])}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDate(project.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
