import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd.MM.yyyy') {
  return format(new Date(date), fmt, { locale: ru });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ru });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1048576).toFixed(1)} МБ`;
}

export function formatBytes(bytes: number) {
  const gb = bytes / 1073741824;
  if (gb >= 1) return `${gb.toFixed(1)} ГБ`;
  return `${(bytes / 1048576).toFixed(0)} МБ`;
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  review: 'На проверке',
  testing: 'Тестирование',
  delivery: 'Сдача',
  completed: 'Завершён',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  testing: 'bg-orange-100 text-orange-700',
  delivery: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  completed: 'Выполнена',
  rejected: 'Отклонена',
};

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const USER_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  active: 'Активен',
  rejected: 'Отклонён',
  blocked: 'Заблокирован',
};

export const USER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-gray-100 text-gray-700',
};

export const DOC_CATEGORY_LABELS: Record<string, string> = {
  passport: 'Паспорт',
  instruction: 'Инструкция',
  drawing: 'Чертёж',
  contract: 'Договор',
  other: 'Прочее',
};
