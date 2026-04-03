'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { cn, MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');

  const isClient = user?.role === 'client';
  const isManager = ['admin', 'senior_manager', 'manager'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceApi.getAll().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => maintenanceApi.create({ equipmentName: equipment, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Заявка создана');
      setShowForm(false); setEquipment(''); setDescription('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => maintenanceApi.updateStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Статус обновлён'); },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заявки на ТОиР</h1>
        {isClient && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Новая заявка
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-blue-900">Новая заявка на ТО</h3>
          <input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="Название оборудования"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Описание проблемы..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={!equipment || !description || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {createMutation.isPending ? 'Отправка...' : 'Отправить'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />) :
          data?.data?.map((req: any) => (
            <div key={req.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{req.equipmentName}</h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', MAINTENANCE_STATUS_COLORS[req.status])}>
                      {MAINTENANCE_STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  {req.managerComment && (
                    <p className="text-sm text-blue-700 mt-2 bg-blue-50 px-3 py-2 rounded-lg">
                      💬 {req.managerComment}
                    </p>
                  )}
                  {req.client && <p className="text-xs text-gray-400 mt-2">Клиент: {req.client.lastName} {req.client.firstName}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(req.createdAt)}</p>
                </div>
                {isManager && req.status === 'new' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => updateMutation.mutate({ id: req.id, status: 'in_progress' })}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg">
                      В работу
                    </button>
                    <button onClick={() => updateMutation.mutate({ id: req.id, status: 'completed' })}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg">
                      Выполнено
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        {!isLoading && data?.data?.length === 0 && <div className="text-center text-gray-500 py-12">Заявок нет</div>}
      </div>
    </div>
  );
}
