import {
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Inbox,
  MessageSquare,
  RefreshCcw,
  Star,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { localizeNotification } from '../../utils/notificationLocalization';
import type { UserNotification } from '../../api/notificationService';

const privateTypes = new Set(['LIB_TICKET_MESSAGE', 'LIB_TICKET_FEEDBACK']);

const actionLink = (notif: UserNotification) => {
  if (notif.link) return notif.link;
  if (notif.type.startsWith('LIB_TICKET')) return '/librarianpage/contact-inbox';
  if (notif.type === 'LIB_REVIEW_NEW') return '/librarianpage/public/reviews';
  if (notif.type.startsWith('LIB_BOOK')) return notif.referenceId ? `/librarianpage/books/${notif.referenceId}` : '/librarianpage/books';
  if (notif.type.startsWith('LIB_COPY')) return notif.referenceId ? `/librarianpage/copies/${notif.referenceId}` : '/librarianpage/copies';
  if (notif.type === 'LIB_POLICY_UPDATED') return '/librarianpage/settings';
  if (notif.type.startsWith('LIB_CIRC') || notif.type.startsWith('LIB_FINE')) {
    return `/librarianpage/transactions${notif.referenceId ? `?highlight=${notif.referenceId}` : ''}`;
  }
  return null;
};

const iconFor = (type: string) => {
  if (type.startsWith('LIB_TICKET')) return MessageSquare;
  if (type === 'LIB_REVIEW_NEW') return Star;
  if (type.startsWith('LIB_BOOK') || type.startsWith('LIB_COPY')) return BookOpen;
  if (type === 'LIB_POLICY_UPDATED') return Bell;
  if (type.startsWith('LIB_FINE')) return CreditCard;
  if (type.startsWith('LIB_CIRC')) return CheckCircle2;
  return Bell;
};

const toneFor = (type: string) => {
  if (privateTypes.has(type)) return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200';
  if (type.startsWith('LIB_FINE')) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200';
  if (type.startsWith('LIB_TICKET')) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200';
  return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200';
};

const LibrarianNotificationsPage = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isEn = language === 'en';

  const labels = {
    title: isEn ? 'Librarian notifications' : 'Thông báo thủ thư',
    subtitle: isEn ? 'System-wide workflow events and private ticket alerts.' : 'Sự kiện chung toàn hệ thống và thông báo riêng theo ticket.',
    allRead: isEn ? 'Mark all read' : 'Đánh dấu tất cả đã đọc',
    refresh: isEn ? 'Refresh' : 'Làm mới',
    empty: isEn ? 'No librarian notifications yet.' : 'Chưa có thông báo thủ thư.',
    system: isEn ? 'System-wide' : 'Toàn hệ thống',
    private: isEn ? 'Private' : 'Riêng thủ thư',
  };

  const open = (notif: UserNotification) => {
    if (!notif.read) markAsRead(notif.userNotificationId);
    const link = actionLink(notif);
    if (link) navigate(link);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{labels.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>{labels.allRead}</Button>
          <Button variant="outline" size="sm" onClick={() => fetchNotifications(0, 20)} title={labels.refresh} aria-label={labels.refresh}>
            <RefreshCcw size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <Inbox className="mx-auto mb-3 h-8 w-8" />
            {labels.empty}
          </div>
        ) : notifications.map((notif) => {
          const localized = localizeNotification(notif, language);
          const Icon = iconFor(notif.type);
          const receivedAt = notif.receivedAt ? new Date(notif.receivedAt) : new Date();
          const isPrivate = privateTypes.has(notif.type);
          return (
            <button
              key={notif.userNotificationId}
              type="button"
              onClick={() => open(notif)}
              className={`flex w-full gap-4 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:bg-slate-900 dark:hover:border-blue-500 ${notif.read ? 'border-slate-200 dark:border-slate-800' : 'border-blue-300 ring-1 ring-blue-100 dark:border-blue-500 dark:ring-blue-500/20'}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${toneFor(notif.type)}`}>
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{localized.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isPrivate ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {isPrivate ? labels.private : labels.system}
                  </span>
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-red-500" />}
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{localized.message}</span>
                <span className="mt-2 block text-xs font-medium text-slate-400">
                  {formatDistanceToNow(Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt, { addSuffix: true, locale: isEn ? enUS : vi })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LibrarianNotificationsPage;
