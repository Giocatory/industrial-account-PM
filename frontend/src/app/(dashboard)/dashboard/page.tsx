'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { FolderKanban, Users, Wrench, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function MetricCard({ label, value, icon: Icon, color, href }: any) {
  const card = (
    <div className={cn('bg-white rounded-xl border p-5 flex items-center gap-4', href && 'hover:shadow-md transition-shadow cursor-pointer')}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getMetrics().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const roleMetrics = () => {
    if (!data) return null;

    if (user?.role === 'client') return [
      { label: 'Всего проектов', value: data.totalProjects, icon: FolderKanban, color: 'bg-blue-100 text-blue-600', href: '/projects' },
      { label: 'Завершённых', value: data.completedProjects, icon: CheckCircle, color: 'bg-green-100 text-green-600', href: '/projects' },
      { label: 'Заявок на ТО', value: data.maintenanceRequests, icon: Wrench, color: 'bg-orange-100 text-orange-600', href: '/maintenance' },
    ];

    if (user?.role === 'manager') return [
      { label: 'Мои проекты', value: data.myProjects, icon: FolderKanban, color: 'bg-blue-100 text-blue-600', href: '/projects' },
      { label: 'В работе', value: data.inProgressProjects, icon: TrendingUp, color: 'bg-yellow-100 text-yellow-600', href: '/projects' },
      { label: 'Новых заявок ТО', value: data.newMaintenanceRequests, icon: Wrench, color: 'bg-red-100 text-red-600', href: '/maintenance' },
      { label: 'Завершённых', value: data.completedProjects, icon: CheckCircle, color: 'bg-green-100 text-green-600', href: '/projects' },
    ];

    return [
      { label: 'Пользователей', value: data.totalUsers, icon: Users, color: 'bg-purple-100 text-purple-600', href: '/users' },
      { label: 'Ожидают подтверждения', value: data.pendingUsers, icon: Clock, color: 'bg-yellow-100 text-yellow-600', href: '/users?status=pending' },
      { label: 'Всего проектов', value: data.totalProjects, icon: FolderKanban, color: 'bg-blue-100 text-blue-600', href: '/projects' },
      { label: 'Активных проектов', value: data.activeProjects, icon: TrendingUp, color: 'bg-green-100 text-green-600', href: '/projects' },
      { label: 'Новых заявок ТО', value: data.newMaintenanceRequests, icon: Wrench, color: 'bg-red-100 text-red-600', href: '/maintenance' },
    ];
  };

  const metrics = roleMetrics();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать, {user?.firstName}!</h1>
        <p className="text-gray-500 text-sm mt-1">Обзор ключевых показателей</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
        </div>
      )}

      {/* Client active project highlight */}
      {user?.role === 'client' && data?.activeProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-600 font-medium mb-1">Активный проект</p>
          <Link href={`/projects/${data.activeProject.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {data.activeProject.title}
          </Link>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Прогресс</span>
              <span>{data.activeProject.progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${data.activeProject.progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
