import { Notification } from '@/types';
import { axiosInstance } from '.';
import { urls } from './urls';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await axiosInstance.get(urls.notifications.getAll);
  return response.data.notifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await axiosInstance.patch(urls.notifications.markAsRead(notificationId));
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const notifications = await getNotifications();
  const unread = notifications.filter(n => !n.is_read);
  await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
};
