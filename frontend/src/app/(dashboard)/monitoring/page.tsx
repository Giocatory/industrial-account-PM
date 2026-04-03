'use client';

import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api';
import { useState } from 'react';
import { cn, formatBytes } from '@/lib/utils';
import { Cpu, HardDrive, Activity, Server, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function MetricBar({ label, percent, color = 'bg-blue-500' }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={cn('h-2.5 rounded-full transition-all', color,
          percent > 85 ? 'bg-red-500' : percent > 65 ? 'bg-yellow-500' : color)}
          style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ServiceStatus({ name, status, latencyMs }: any) {
  const ok = status === 'ok';
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-xs px-2 py-0.5 rounded-full', ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
          {ok ? 'OK' : 'ERROR'}
        </span>
        <span className="text-xs text-gray-400">{latencyMs}ms</span>
      </div>
    </div>
  );
}

const LOG_COLORS: Record<string, string> = {
  info: 'text-blue-600',
  warn: 'text-yellow-600',
  error: 'text-red-600',
  debug: 'text-gray-500',
};

export default function MonitoringPage() {
  const [logLevel, setLogLevel] = useState('');
  const [logComponent, setLogComponent] = useState('');

  const { data: system, isLoading: sysLoading } = useQuery({
    queryKey: ['monitoring-system'],
    queryFn: () => monitoringApi.getSystem().then(r => r.data),
    refetchInterval: 10_000,
  });

  const { data: services } = useQuery({
    queryKey: ['monitoring-services'],
    queryFn: () => monitoringApi.getServices().then(r => r.data),
    refetchInterval: 15_000,
  });

  const { data: appMetrics } = useQuery({
    queryKey: ['monitoring-app'],
    queryFn: () => monitoringApi.getApp().then(r => r.data),
    refetchInterval: 10_000,
  });

  const { data: logs } = useQuery({
    queryKey: ['monitoring-logs', logLevel, logComponent],
    queryFn: () => monitoringApi.getLogs({ level: logLevel || undefined, component: logComponent || undefined }).then(r => r.data),
    refetchInterval: 5_000,
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Панель мониторинга</h1>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <Cpu className="w-5 h-5 text-blue-600" /> Процессор, память, диск
          </div>
          {sysLoading ? <div className="animate-pulse space-y-3"><div className="h-6 bg-gray-100 rounded" /><div className="h-6 bg-gray-100 rounded" /></div> : <>
            <MetricBar label={`CPU (${system?.cpu?.cores} ядер)`} percent={system?.cpu?.usagePercent} />
            <MetricBar label="Оперативная память" percent={system?.memory?.usagePercent} color="bg-purple-500" />
            <MetricBar label="Дисковое пространство" percent={system?.disk?.usagePercent} color="bg-orange-500" />
            <div className="text-xs text-gray-500 pt-1">
              RAM: {formatBytes(system?.memory?.used)} / {formatBytes(system?.memory?.total)} •
              Диск: {formatBytes(system?.disk?.used)} / {formatBytes(system?.disk?.total)} •
              Uptime: {Math.floor((system?.uptime || 0) / 3600)}ч {Math.floor(((system?.uptime || 0) % 3600) / 60)}м
            </div>
          </>}
        </div>

        <div className="bg-white border rounded-xl p-5">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <Server className="w-5 h-5 text-green-600" /> Состояние сервисов
          </div>
          {services && Object.entries(services).map(([name, s]: [string, any]) => (
            <ServiceStatus key={name} name={name.toUpperCase()} status={s.status} latencyMs={s.latencyMs} />
          ))}
        </div>
      </div>

      {/* App Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Активных сессий', value: appMetrics?.activeSessions, icon: Activity, color: 'bg-blue-100 text-blue-600' },
          { label: 'Запросов/мин', value: appMetrics?.requestsLastMinute, icon: Activity, color: 'bg-green-100 text-green-600' },
          { label: 'Ср. ответ (мс)', value: appMetrics?.avgResponseMs, icon: Activity, color: 'bg-purple-100 text-purple-600' },
          { label: 'Ошибок/час', value: appMetrics?.errorsLastHour, icon: AlertCircle, color: 'bg-red-100 text-red-600' },
        ].map((m, i) => (
          <div key={i} className="bg-white border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', m.color)}>
              <m.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{m.value ?? '—'}</p>
              <p className="text-xs text-gray-500">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold">Логи приложения</h3>
          <div className="flex gap-2">
            <select value={logLevel} onChange={e => setLogLevel(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5">
              <option value="">Все уровни</option>
              {['info', 'warn', 'error', 'debug'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <select value={logComponent} onChange={e => setLogComponent(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5">
              <option value="">Все компоненты</option>
              {['app', 'db', 'api', 'auth'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="font-mono text-xs bg-gray-950 text-gray-200 p-4 max-h-80 overflow-y-auto space-y-1">
          {logs?.map((log: any, i: number) => (
            <div key={i} className="flex gap-3">
              <span className="text-gray-500 shrink-0">{log.timestamp}</span>
              <span className={cn('shrink-0 w-12', LOG_COLORS[log.level] || 'text-gray-400')}>{log.level.toUpperCase()}</span>
              <span className="text-blue-400 shrink-0">[{log.component}]</span>
              <span>{log.message}</span>
            </div>
          ))}
          {!logs?.length && <div className="text-gray-500">Логи отсутствуют</div>}
        </div>
      </div>
    </div>
  );
}
