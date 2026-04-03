'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Search, Upload, Download, Trash2, FileText } from 'lucide-react';
import { DOC_CATEGORY_LABELS, formatFileSize, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState('');

  const canUpload = ['admin', 'senior_manager', 'manager'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, category, equipment],
    queryFn: () => documentsApi.getAll({ search, category: category || undefined, equipmentName: equipment || undefined }).then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => documentsApi.upload(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Документ загружен'); },
    onError: () => toast.error('Ошибка загрузки'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Документ удалён'); },
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name.replace(/\.[^.]+$/, ''));
    uploadMutation.mutate(fd);
  };

  const handleDownload = async (id: string) => {
    const { data } = await documentsApi.getDownloadUrl(id);
    window.open(data.url, '_blank');
  };

  const equipmentList = [...new Set((data?.data || []).map((d: any) => d.equipmentName).filter(Boolean))];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Документы</h1>
        {canUpload && (
          <>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Upload className="w-4 h-4" />
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск документов..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2">
          <option value="">Все категории</option>
          {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={equipment} onChange={e => setEquipment(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2">
          <option value="">Всё оборудование</option>
          {equipmentList.map((eq: any) => <option key={eq} value={eq}>{eq}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Оборудование</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Размер</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Загружен</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
            )) : data?.data?.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400 shrink-0" />{doc.name}</div></td>
                <td className="px-4 py-3 text-gray-500">{DOC_CATEGORY_LABELS[doc.category]}</td>
                <td className="px-4 py-3 text-gray-500">{doc.equipmentName || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{doc.fileSize ? formatFileSize(doc.fileSize) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(doc.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleDownload(doc.id)} className="text-blue-600 hover:text-blue-800 p-1"><Download className="w-4 h-4" /></button>
                    {canUpload && <button onClick={() => deleteMutation.mutate(doc.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data?.data?.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">Документы не найдены</div>}
      </div>
    </div>
  );
}
