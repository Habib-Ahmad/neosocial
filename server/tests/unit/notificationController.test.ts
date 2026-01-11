import { Request, Response } from "express";
import { getNotifications, markNotificationAsRead } from "../../controllers/notificationController";
import * as notificationService from "../../service/notificationService";

jest.mock("../../service/notificationService");

describe("Notification Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should get notifications successfully", async () => {
      const mockNotifications = [
        { id: "notif1", message: "New friend request", read: false },
        { id: "notif2", message: "Post liked", read: true },
      ];

      (notificationService.getUserNotificationsService as any).mockResolvedValue(mockNotifications);

      await getNotifications(req as Request, res as Response);

      expect(notificationService.getUserNotificationsService).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ notifications: mockNotifications });
    });

    it("should return 401 if user is not authenticated", async () => {
      req.user = undefined;

      await getNotifications(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized: No user ID found" });
      expect(notificationService.getUserNotificationsService).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
      (notificationService.getUserNotificationsService as any).mockRejectedValue(
        new Error("Database error")
      );

      await getNotifications(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("markNotificationAsRead", () => {
    it("should mark notification as read successfully", async () => {
      req.params = { id: "notif123" };
      (notificationService.markNotificationAsReadService as any).mockResolvedValue(undefined);

      await markNotificationAsRead(req as Request, res as Response);

      expect(notificationService.markNotificationAsReadService).toHaveBeenCalledWith("notif123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Notification marked as read" });
    });

    it("should handle errors and return 500", async () => {
      req.params = { id: "notif123" };
      (notificationService.markNotificationAsReadService as any).mockRejectedValue(
        new Error("Update failed")
      );

      await markNotificationAsRead(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
    });
  });
});
