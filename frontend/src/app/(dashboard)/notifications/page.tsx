'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { cn, timeAgo, formatDate } from '@/lib/utils';
import { Bell, CheckCheck, Info, AlertCircle, FileText, UserCheck, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  registration:    { icon: UserCheck,    color: 'bg-blue-100 text-blue-600' },
  request:         { icon: Wrench,       color: 'bg-orange-100 text-orange-600' },
  status_change:   { icon: AlertCircle,  color: 'bg-yellow-100 text-yellow-600' },
  document_upload: { icon: FileText,     color: 'bg-green-100 text-green-600' },
  system:          { icon: Info,         color: 'bg-gray-100 text-gray-600' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 100 }).then(r => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('Все уведомления прочитаны');
    },
  });

  // Group notifications by date
  const grouped = (data?.data || []).reduce((acc: Record<string, any[]>, n: any) => {
    const key = formatDate(n.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const unreadCount = (data?.data || []).filter((n: any) => !n.isRead).length;

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Уведомления</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Отметить все прочитанными
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Уведомлений нет</p>
        </div>
      )}

      {!isLoading && Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{date}</p>
          <div className="space-y-2">
            {(items as any[]).map((n: any) => {
              const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.system;
              const Icon = typeInfo.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                  className={cn(
                    'bg-white border rounded-xl p-4 flex gap-4 transition-all',
                    !n.isRead ? 'border-blue-200 shadow-sm cursor-pointer hover:shadow-md' : 'opacity-75',
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', typeInfo.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', !n.isRead && 'text-gray-900')}>{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
