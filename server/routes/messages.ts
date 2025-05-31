import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createConversation,
  sendMessage,
  getMessages,
  getUserConversations,
} from "../controllers/messagingController";

const router = express.Router();

router.post("/", validateToken, createConversation);
router.post("/:id/messages", validateToken, sendMessage);
router.get("/:id/messages", validateToken, getMessages);
router.get("/", validateToken, getUserConversations);

export default router;
