import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { toast } from 'sonner';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, UserNotification, NotificationResponse } from '../api/notificationService';
import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';
import { localizeNotification } from '../utils/notificationLocalization';

interface NotificationContextProps {
  notifications: UserNotification[];
  unreadCount: number;
  fetchNotifications: (page?: number, size?: number) => Promise<void>;
  markAsRead: (userNotificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const normalizeNotification = (notification: UserNotification): UserNotification => ({
  ...notification,
  receivedAt: notification.receivedAt || new Date().toISOString(),
});

const resolveNotificationLink = (n: UserNotification): string | null => {
  if (n.link) return n.link;
  if (n.type.startsWith('LIB_TICKET')) return '/librarianpage/contact-inbox';
  if (n.type.startsWith('LIB_REVIEW')) return n.referenceId ? `/librarianpage/public/reviews?highlight=${n.referenceId}` : '/librarianpage/public/reviews';
  if (n.type.startsWith('LIB_BOOK')) return n.referenceId ? `/librarianpage/books/${n.referenceId}` : '/librarianpage/books';
  if (n.type.startsWith('LIB_COPY')) return n.referenceId ? `/librarianpage/copies/${n.referenceId}` : '/librarianpage/copies';
  if (n.type === 'LIB_POLICY_UPDATED') return '/librarianpage/settings';
  if (n.type.startsWith('LIB_CIRC') || n.type.startsWith('LIB_FINE')) {
    const highlight = n.referenceId ? `?highlight=${n.referenceId}` : '';
    return `/librarianpage/transactions${highlight}`;
  }
  if (n.type.includes('BORROW') || n.type.includes('OVERDUE') || n.type.includes('RETURN') || n.type === 'PICKUP_CONFIRMED') {
    const highlight = n.referenceId ? `?highlight=${n.referenceId}` : '';
    return `/userpage/my-books${highlight}`;
  }
  if (n.type === 'FINE_ISSUED' || n.type === 'FINE_PAID') return '/userpage/fines';
  if (n.type.startsWith('CONTACT_TICKET')) return '/userpage/contact-tickets';
  if (n.type.includes('BOOK') || n.type.includes('RESERVATION')) {
    const highlight = n.referenceId ? `?highlight=${n.referenceId}` : '';
    return `/userpage/reservations${highlight}`;
  }
  return null;
};

const openNotificationLink = (link: string) => {
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.location.href = link;
    return;
  }
  window.location.href = link.startsWith('/#') ? link : `/#${link}`;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { userType } = useAuth(); // Only connect if user is authenticated
  const { language } = useTranslation();

  const fetchNotifications = useCallback(async (page: number = 0, size: number = 20) => {
    try {
      const response = await getNotifications(page, size);
      if (response.code === 200) {
        setNotifications((prev) => {
          const content = response.data.content.map(normalizeNotification);
          // If page is 0, replace, else append
          if (page === 0) return content;
          return [...prev, ...content];
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.code === 200) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (userNotificationId: string) => {
    // Optimistic UI update
    setNotifications((prev) => 
      prev.map(n => n.userNotificationId === userNotificationId ? { ...n, read: true } : n)
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    
    // Call API to mark as read
    try {
      await markNotificationAsRead(userNotificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Optional: Revert optimistic UI update if API fails
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const showToast = (n: UserNotification) => {
    const localized = localizeNotification(n, language);
    const link = resolveNotificationLink(n);
    const opts = {
      description: localized.message,
      action: link
        ? {
            label: language === 'en' ? 'View' : 'Xem',
            onClick: () => openNotificationLink(link),
          }
        : undefined,
    };
    switch (n.type) {
      case 'OVERDUE_WARNING':
      case 'FINE_ISSUED':
        toast.error(localized.title, { ...opts, duration: Infinity });
        break;
      case 'BORROW_CANCELLED_EXPIRED':
        toast.warning(localized.title, { ...opts, duration: Infinity });
        break;
      case 'BORROW_SUCCESS':
      case 'PICKUP_CONFIRMED':
      case 'BOOK_AVAILABLE':
      case 'WISHLIST_BOOK_AVAILABLE':
      case 'BOOK_RESERVED':
        toast.success(localized.title, opts);
        break;
      default:
        toast.info(localized.title, opts);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    // Fetch initial notifications and unread count
    fetchNotifications(0, 20);
    fetchUnreadCount();

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function () {
      client.subscribe('/user/queue/notifications', (message: IMessage) => {
        if (message.body) {
          try {
            const notification: UserNotification = normalizeNotification(JSON.parse(message.body));
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            showToast(notification);
          } catch (e) {
            console.error('Failed to parse notification message:', e);
          }
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userType, fetchNotifications, fetchUnreadCount, language]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
