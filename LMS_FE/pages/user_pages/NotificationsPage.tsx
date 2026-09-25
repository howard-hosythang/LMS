import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { localizeNotification } from '../../utils/notificationLocalization';

const NotificationItem = ({
  type,
  title,
  message,
  time,
  isRead,
}: any) => {
  const styles: any = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-white',
      border: 'border-gray-100', // Green border usually for specific emphasis, but design implies clean look
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: CheckCircle,
    },
    info: {
      bg: 'bg-white',
      border: 'border-gray-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Info,
    },
    warning: {
      bg: 'bg-white',
      border: 'border-gray-100',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: Bell,
    },
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  const currentBg = !isRead ? 'bg-blue-100 border-blue-100' : `${style.bg} ${style.border}`;

  return (
    <div
      className={`relative p-6 rounded-xl border ${currentBg} flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all cursor-pointer`}
    >
      {!isRead && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm animate-pulse"></span>
      )}
      <div
        className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={24} className={style.iconColor} />
      </div>
      <div className="flex-grow">
        <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm mb-3 leading-relaxed">{message}</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center text-xs text-gray-500 font-medium">
            <Clock size={14} className="mr-1" /> {time}
          </span>
        </div>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { language, t } = useTranslation();

  const getNotificationActionLink = (notif: any) => {
    if (notif.link) return notif.link;
    if (notif.type.includes('BORROW') || notif.type.includes('OVERDUE') || notif.type.includes('RETURN') || notif.type === 'PICKUP_CONFIRMED') {
      const highlight = notif.referenceId ? `?highlight=${notif.referenceId}` : '';
      return `/userpage/my-books${highlight}`;
    }
    if (notif.type === 'FINE_ISSUED' || notif.type === 'FINE_PAID') return '/userpage/fines';
    if (notif.type.includes('BOOK') || notif.type.includes('RESERVATION')) {
      const highlight = notif.referenceId ? `?highlight=${notif.referenceId}` : '';
      return `/userpage/reservations${highlight}`;
    }
    return null;
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) markAsRead(notif.userNotificationId);

    const actionLink = getNotificationActionLink(notif);
    if (!actionLink) return;

    if (actionLink.startsWith('/')) {
      navigate(actionLink);
    } else {
      window.location.href = actionLink;
    }
  };

  // Helper to map API notification types to UI styles
  const mapTypeToStyle = (type: string) => {
    switch (type) {
      case 'BORROW_SUCCESS':
      case 'PICKUP_CONFIRMED':
      case 'BOOK_AVAILABLE':
      case 'WISHLIST_BOOK_AVAILABLE':
      case 'BOOK_RESERVED':
      case 'FINE_PAID':
      case 'RETURN_CONFIRMED':
        return 'success';
      case 'BORROW_CANCELLED_EXPIRED':
      case 'FINE_ISSUED':
        return 'critical';
      case 'OVERDUE_WARNING':
      case 'RETURN_REMINDER':
        return 'warning';
      case 'SYSTEM_MAINTENANCE':
      default:
        return 'info';
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('notifications.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('notifications.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            {t('notifications.markAllRead')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(0, 20)}
            title={t('notifications.refresh')}
            aria-label={t('notifications.refresh')}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('notifications.empty')}
          </div>
        ) : (
          notifications.map((notif) => (
            (() => {
              const localized = localizeNotification(notif, language);
              const receivedAt = notif.receivedAt ? new Date(notif.receivedAt) : new Date();
              return (
                <div key={notif.userNotificationId} onClick={() => handleNotificationClick(notif)} className="transform transition-transform active:scale-[0.99]">
                  <NotificationItem
                    type={mapTypeToStyle(notif.type)}
                    title={localized.title}
                    message={localized.message}
                    time={formatDistanceToNow(Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt, { addSuffix: true, locale: language === 'en' ? enUS : vi })}
                    isRead={notif.read}
                  />
                </div>
              );
            })()
          ))
        )}
      </div>

      {notifications.length >= 20 && (
        <div className="text-center pt-8">
          <Button variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => fetchNotifications(1, 20)}>
            {t('notifications.loadMore')} <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
