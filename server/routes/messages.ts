import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  getConversation,
  markConversationAsRead,
} from "../controllers/messagingController";

const router = express.Router();

router.post("/", validateToken, createConversation);
router.get("/", validateToken, getUserConversations);
router.get("/:id", validateToken, getConversation);
router.post("/:id/messages", validateToken, sendMessage);
router.get("/:id/messages", validateToken, getMessages);
router.post("/:id/read", validateToken, markConversationAsRead);

export default router;
