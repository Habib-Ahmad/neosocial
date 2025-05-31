import express from "express";
import { validateToken } from "../middleware/validateToken";
import { getNotifications, markNotificationAsRead } from "../controllers/notificationController";

const router = express.Router();

router.get("/", validateToken, getNotifications);
router.patch("/:id/read", validateToken, markNotificationAsRead);

export default router;
