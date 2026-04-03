'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, ROLE_LABELS, type UserRole } from '@/store/auth.store';
import { useNotificationsSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { notificationsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, FolderKanban, Users, UserCircle, Bell, MessageSquare,
  FileText, Wrench, MapPin, Phone, Monitor, ChevronLeft, ChevronRight,
  LogOut, Settings, Menu, X,
} from 'lucide-react';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}[] = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard, roles: ['tech_admin', 'admin', 'senior_manager', 'manager', 'client'] },
  { href: '/projects', label: 'Проекты', icon: FolderKanban, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/users', label: 'Пользователи', icon: Users, roles: ['admin', 'senior_manager'] },
  { href: '/clients', label: 'Клиенты', icon: UserCircle, roles: ['admin', 'senior_manager', 'manager'] },
  { href: '/documents', label: 'Документы', icon: FileText, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/maintenance', label: 'Заявки ТОиР', icon: Wrench, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/installation', label: 'Схема установки', icon: MapPin, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/chat', label: 'Чат', icon: MessageSquare, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/notifications', label: 'Уведомления', icon: Bell, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/contacts', label: 'Контакты', icon: Phone, roles: ['admin', 'senior_manager', 'manager', 'client'] },
  { href: '/monitoring', label: 'Мониторинг', icon: Monitor, roles: ['tech_admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Route guard
  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  // Unread notifications
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().then(r => r.data.count),
    refetchInterval: 30_000,
  });

  useEffect(() => { if (unreadData !== undefined) setUnreadCount(unreadData); }, [unreadData]);

  // Real-time notifications
  useNotificationsSocket((n) => {
    setUnreadCount(c => c + 1);
  });

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      'flex flex-col h-full bg-sidebar text-sidebar-foreground',
      !mobile && (collapsed ? 'w-16' : 'w-64'),
      mobile && 'w-72',
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed && !mobile && 'justify-center')}>
        {(!collapsed || mobile) && (
          <span className="font-bold text-lg truncate">ЛК Управление</span>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn('p-1 rounded hover:bg-sidebar-accent transition-colors', !collapsed && 'ml-auto')}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User info */}
      <div className={cn('px-4 py-3 border-b border-sidebar-border', collapsed && !mobile && 'px-2')}>
        {(!collapsed || mobile) ? (
          <div>
            <p className="text-sm font-medium truncate">{user.lastName} {user.firstName}</p>
            <p className="text-xs text-blue-300">{ROLE_LABELS[user.role]}</p>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mx-auto">
            {user.firstName[0]}{user.lastName[0]}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleNav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                collapsed && !mobile && 'justify-center px-2',
                active ? 'bg-blue-600 text-white' : 'hover:bg-sidebar-accent text-blue-100',
              )}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobile) && <span>{item.label}</span>}
              {item.href === '/notifications' && unreadCount > 0 && (!collapsed || mobile) && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-2">
        <Link
          href="/profile"
          className={cn('flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent transition-colors', collapsed && !mobile && 'justify-center px-2')}
        >
          <Settings className="w-5 h-5" />
          {(!collapsed || mobile) && <span>Профиль</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-900/30 text-red-300 transition-colors', collapsed && !mobile && 'justify-center px-2')}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || mobile) && <span>Выйти</span>}
        </button>
      </div>
    </div>
  );

  // Breadcrumbs
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => {
    const href = '/' + pathParts.slice(0, i + 1).join('/');
    const label = NAV_ITEMS.find(n => n.href === href)?.label || part;
    return { href, label };
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex shrink-0 sidebar-transition">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center px-4 gap-4 shrink-0">
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.href} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium truncate">{bc.label}</span>
                ) : (
                  <Link href={bc.href} className="hover:text-blue-600 truncate">{bc.label}</Link>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications bell */}
            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100" title="Уведомления">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link href="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.firstName}</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
