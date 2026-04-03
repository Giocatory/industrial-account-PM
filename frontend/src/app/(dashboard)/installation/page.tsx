'use client';

import { useQuery } from '@tanstack/react-query';
import { installationApi } from '@/lib/api';
import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InstallationPage() {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<any>(null);

  const { data: schemas } = useQuery({
    queryKey: ['installation'],
    queryFn: () => installationApi.getAll().then(r => r.data),
  });

  const selectedSchema = schemas?.find((s: any) => s.id === selectedSchemaId) || schemas?.[0];

  const NODE_ICONS: Record<string, string> = {
    compressor: '⚙️', valve: '🔧', 'heat-exchanger': '🌡️',
    pump: '💧', filter: '🔲', gauge: '📊',
    'pipe-input': '→', 'pipe-output': '←',
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Схема установки</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Schema list */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-3 border-b"><p className="font-medium text-sm">Схемы</p></div>
          {schemas?.map((schema: any) => (
            <button key={schema.id} onClick={() => { setSelectedSchemaId(schema.id); setActiveNode(null); }}
              className={cn('w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-gray-50 border-b last:border-0',
                selectedSchema?.id === schema.id && 'bg-blue-50 border-l-2 border-l-blue-600 text-blue-700')}>
              <span className="flex-1 truncate">{schema.name}</span>
              <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
            </button>
          ))}
        </div>

        {/* Interactive schema viewer */}
        <div className="lg:col-span-3 bg-white border rounded-xl overflow-hidden">
          {selectedSchema ? (
            <>
              <div className="p-3 border-b flex items-center justify-between">
                <p className="font-semibold text-sm">{selectedSchema.name}</p>
                <p className="text-xs text-gray-400">{selectedSchema.nodes?.length} узлов</p>
              </div>

              <TransformWrapper initialScale={1} minScale={0.5} maxScale={3}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <div className="relative">
                    {/* Controls */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                      <button onClick={() => zoomIn()} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-50 shadow-sm">
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button onClick={() => zoomOut()} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-50 shadow-sm">
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button onClick={() => resetTransform()} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-50 shadow-sm">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <TransformComponent wrapperStyle={{ width: '100%', height: '400px' }}>
                      <div className="w-full h-96 bg-gray-50 relative" style={{ width: '800px', height: '400px' }}>
                        {/* Connection lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {selectedSchema.nodes?.slice(0, -1).map((node: any, i: number) => {
                            const next = selectedSchema.nodes[i + 1];
                            return (
                              <line key={i}
                                x1={`${node.x + 4}%`} y1={`${node.y + 2}%`}
                                x2={`${next.x}%`} y2={`${next.y + 2}%`}
                                stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4,4" />
                            );
                          })}
                        </svg>

                        {/* Nodes */}
                        {selectedSchema.nodes?.map((node: any) => (
                          <button key={node.id}
                            onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            className={cn(
                              'absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110',
                              'flex flex-col items-center gap-1 group',
                            )}>
                            <div className={cn(
                              'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl shadow-md bg-white',
                              activeNode?.id === node.id ? 'border-blue-500 shadow-blue-200' : 'border-gray-200',
                            )}>
                              {NODE_ICONS[node.type] || '●'}
                            </div>
                            <span className="text-xs font-medium bg-white/90 px-1.5 py-0.5 rounded border shadow-sm whitespace-nowrap max-w-24 truncate">
                              {node.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </TransformComponent>
                  </div>
                )}
              </TransformWrapper>

              {/* Node info popup */}
              {activeNode && (
                <div className="border-t p-4 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{NODE_ICONS[activeNode.type] || '●'}</div>
                    <div>
                      <p className="font-semibold text-blue-900">{activeNode.label}</p>
                      <p className="text-xs text-blue-600 capitalize mt-0.5">{activeNode.type}</p>
                      {activeNode.description && <p className="text-sm text-gray-700 mt-1">{activeNode.description}</p>}
                    </div>
                    <button onClick={() => setActiveNode(null)} className="ml-auto text-gray-400 hover:text-gray-600 text-lg">×</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Выберите схему для просмотра
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
