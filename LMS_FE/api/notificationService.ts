import axiosInstance from './axiosInstance';

export interface UserNotification {
  userNotificationId: string;
  notificationId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  referenceId: string | null;
  read: boolean;
  receivedAt: string;
  readAt: string | null;
}

export interface NotificationResponse {
  code: number;
  message: string;
  data: {
    content: UserNotification[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isFirst: boolean;
    isLast: boolean;
  };
}

export const getNotifications = async (page: number = 0, size: number = 20): Promise<NotificationResponse> => {
  const response = await axiosInstance.get('/users/notifications', {
    params: { page, size },
  });
  return response as any;
};

export const getUnreadCount = async (): Promise<{ code: number; message: string; data: number }> => {
  const response = await axiosInstance.get('/users/notifications/unread-count');
  return response as any;
};

export const markNotificationAsRead = async (userNotificationId: string): Promise<{ code: number; message: string; data: string }> => {
  const response = await axiosInstance.put(`/users/notifications/${userNotificationId}/read`);
  return response as any;
};

export const markAllNotificationsAsRead = async (): Promise<{ code: number; message: string; data: string }> => {
  const response = await axiosInstance.put('/users/notifications/read-all');
  return response as any;
};
