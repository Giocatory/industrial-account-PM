'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, projectsApi } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useChatSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { cn, timeAgo } from '@/lib/utils';
import { Send, MessageSquare, FolderKanban } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's projects to show in sidebar (as chat rooms)
  const { data: projectsData } = useQuery({
    queryKey: ['chat-projects'],
    queryFn: () => projectsApi.getAll({ limit: 50 }).then(r => r.data),
  });

  // Load dialogs (projects with existing messages)
  const { data: dialogs } = useQuery({
    queryKey: ['dialogs'],
    queryFn: () => chatApi.getDialogs().then(r => r.data),
    refetchInterval: 10_000,
  });

  // Load message history when active project changes
  const { data: historyData } = useQuery({
    queryKey: ['messages', activeProjectId],
    queryFn: () =>
      activeProjectId
        ? chatApi.getMessages(activeProjectId).then(r => r.data)
        : null,
    enabled: !!activeProjectId,
  });

  useEffect(() => {
    if (historyData) setMessages((historyData as any)?.data || []);
  }, [historyData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when opening a dialog
  useEffect(() => {
    if (activeProjectId) {
      chatApi.getMessages(activeProjectId).then(() => {
        qc.invalidateQueries({ queryKey: ['dialogs'] });
        qc.invalidateQueries({ queryKey: ['unread-count'] });
      });
    }
  }, [activeProjectId]);

  // Real-time messages
  const { sendMessage } = useChatSocket(activeProjectId, (msg) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    qc.invalidateQueries({ queryKey: ['dialogs'] });
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeProjectId) return;
    sendMessage(text);
    // Optimistic update
    setMessages(prev => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        content: text,
        senderId: user?.id,
        sender: user,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');
  };

  // Merge projects and dialogs into sidebar list
  const projects: any[] = projectsData?.data || [];
  const dialogMap = new Map((dialogs || []).map((d: any) => [d.projectId, d]));

  // Projects with messages first, then rest
  const sidebarItems = [
    ...projects.filter((p: any) => dialogMap.has(p.id)),
    ...projects.filter((p: any) => !dialogMap.has(p.id)),
  ];

  const activeProject = projects.find((p: any) => p.id === activeProjectId);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────── */}
      <div className="w-72 border-r flex flex-col bg-gray-50 shrink-0">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-gray-900">Чат</h2>
          <p className="text-xs text-gray-400 mt-0.5">Общение по проектам</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarItems.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Нет доступных проектов
            </div>
          )}

          {sidebarItems.map((project: any) => {
            const dialog = dialogMap.get(project.id);
            const isActive = activeProjectId === project.id;
            return (
              <button
                key={project.id}
                onClick={() => {
                  setActiveProjectId(project.id);
                  setMessages([]);
                }}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-white border-b transition-colors',
                  isActive && 'bg-white border-l-2 border-l-blue-600',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate leading-tight">
                    {project.title}
                  </p>
                  {dialog?.unread > 0 && (
                    <span className="shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {dialog.unread}
                    </span>
                  )}
                </div>
                {dialog?.lastMessage ? (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {dialog.lastSender}: {dialog.lastMessage}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Нет сообщений</p>
                )}
                {dialog?.createdAt && (
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(dialog.createdAt)}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────── */}
      {activeProjectId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-14 border-b px-5 flex items-center bg-white gap-3 shrink-0">
            <FolderKanban className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm truncate">
              {activeProject?.title || 'Чат по проекту'}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                Начните переписку
              </div>
            )}
            {messages.map((msg: any) => {
              const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
              return (
                <div key={msg.id} className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && (
                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {msg.sender?.firstName?.[0] || '?'}
                    </div>
                  )}
                  <div className={cn(
                    'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm',
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border text-gray-900 rounded-bl-sm',
                  )}>
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1 opacity-60">
                        {msg.sender?.firstName} {msg.sender?.lastName}
                      </p>
                    )}
                    <p className="break-words">{msg.content}</p>
                    <p className={cn('text-xs mt-1', isOwn ? 'text-blue-200' : 'text-gray-400')}>
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Написать сообщение... (Enter — отправить)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3 bg-gray-50">
          <MessageSquare className="w-14 h-14 opacity-20" />
          <p className="text-sm">Выберите проект для переписки</p>
        </div>
      )}
    </div>
  );
}
