import e, { Request, Response } from "express";
import {
  createNotificationService,
  getUserNotificationsService,
  markNotificationAsReadService,
} from "../service/notificationService";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    // Fetch notifications for the user
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: No user ID found" });
      return;
    }
    const notifications = await getUserNotificationsService(userId);
    res.status(200).json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const notifId = req.params.id;
    await markNotificationAsReadService(notifId);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
