'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, documentsApi, maintenanceApi } from '@/lib/api';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatSocket } from '@/lib/socket';
import { cn, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, DOC_CATEGORY_LABELS, MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS, formatDateTime, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { Download, Upload, Send, FileText, Clock } from 'lucide-react';

const TABS = ['Обзор', 'Документы', 'ТОиР', 'Чат', 'История'];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Обзор');
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', params.id],
    queryFn: () => projectsApi.getOne(params.id).then(r => r.data),
  });

  const { data: docs } = useQuery({
    queryKey: ['docs', params.id],
    queryFn: () => documentsApi.getAll({ projectId: params.id }).then(r => r.data),
    enabled: tab === 'Документы',
  });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', params.id],
    queryFn: () => maintenanceApi.getAll({ projectId: params.id }).then(r => r.data),
    enabled: tab === 'ТОиР',
  });

  const { sendMessage } = useChatSocket(params.id, (msg) => {
    setMessages(prev => [...prev, msg]);
  });

  const handleSend = () => {
    if (!chatMsg.trim()) return;
    sendMessage(chatMsg);
    setMessages(prev => [...prev, { id: Date.now(), content: chatMsg, sender: user, createdAt: new Date() }]);
    setChatMsg('');
  };

  const handleDownload = async (docId: string) => {
    try {
      const { data } = await documentsApi.getDownloadUrl(docId);
      window.open(data.url, '_blank');
    } catch { toast.error('Ошибка загрузки файла'); }
  };

  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64 mb-4" /><div className="h-64 bg-gray-100 rounded-xl" /></div>;
  if (!project) return <div className="p-6 text-gray-500">Проект не найден</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          {project.equipmentName && <p className="text-gray-500 text-sm mt-1">Оборудование: {project.equipmentName}</p>}
        </div>
        <span className={cn('text-sm px-3 py-1 rounded-full font-medium', PROJECT_STATUS_COLORS[project.status])}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>Прогресс выполнения</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'Обзор' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h3 className="font-semibold">Информация о проекте</h3>
            {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
            {project.manager && (
              <div className="text-sm"><span className="text-gray-500">Менеджер: </span>{project.manager.lastName} {project.manager.firstName}</div>
            )}
            {project.client && (
              <div className="text-sm"><span className="text-gray-500">Клиент: </span>{project.client.lastName} {project.client.firstName}</div>
            )}
            {project.startDate && (
              <div className="text-sm"><span className="text-gray-500">Начало: </span>{formatDateTime(project.startDate)}</div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Статусы проекта</h3>
            <div className="space-y-2">
              {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', project.status === key ? 'bg-blue-600' : 'bg-gray-200')} />
                  <span className={cn('text-sm', project.status === key ? 'font-medium text-gray-900' : 'text-gray-500')}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Документы' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Документы проекта</h3>
            {['admin','senior_manager','manager'].includes(user?.role || '') && (
              <label className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                <Upload className="w-4 h-4" />
                Загрузить
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('name', file.name.replace(/\.[^.]+$/, ''));
                  fd.append('projectId', params.id);
                  try {
                    const { documentsApi: dApi } = await import('@/lib/api');
                    await dApi.upload(fd);
                    qc.invalidateQueries({ queryKey: ['docs', params.id] });
                    toast.success('Документ загружен');
                  } catch { toast.error('Ошибка загрузки'); }
                }} />
              </label>
            )}
          </div>
          {docs?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Документы не загружены</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Название</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Категория</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Размер</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {docs?.data?.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{DOC_CATEGORY_LABELS[doc.category] || doc.category}</td>
                    <td className="px-4 py-3 text-gray-500">{doc.fileSize ? formatFileSize(doc.fileSize) : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDownload(doc.id)} className="text-blue-600 hover:text-blue-800">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ТОиР' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold">Заявки на техническое обслуживание</h3></div>
          {maintenance?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Заявок нет</div>
          ) : (
            <div className="divide-y">
              {maintenance?.data?.map((req: any) => (
                <div key={req.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{req.equipmentName}</p>
                    <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                    {req.managerComment && <p className="text-xs text-blue-600 mt-1">Комментарий: {req.managerComment}</p>}
                  </div>
                  <span className={cn('shrink-0 text-xs px-2 py-1 rounded-full', MAINTENANCE_STATUS_COLORS[req.status])}>
                    {MAINTENANCE_STATUS_LABELS[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Чат' && (
        <div className="bg-white rounded-xl border flex flex-col h-96">
          <div className="p-4 border-b"><h3 className="font-semibold">Чат по проекту</h3></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg: any) => {
              const isOwn = msg.sender?.id === user?.id || msg.senderId === user?.id;
              return (
                <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-xs lg:max-w-md px-3 py-2 rounded-xl text-sm', isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900')}>
                    {!isOwn && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender?.firstName}</p>}
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Написать сообщение..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {tab === 'История' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              История изменений проекта
            </h3>
          </div>
          <div className="divide-y">
            {[
              { label: `Статус изменён на "${PROJECT_STATUS_LABELS[project.status]}"`, date: project.updatedAt, icon: '🔄' },
              { label: 'Проект создан', date: project.createdAt, icon: '✅' },
            ].map((entry, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <span className="text-xl shrink-0">{entry.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
