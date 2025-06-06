import { Request, Response } from "express";
import {
  createConversationService,
  sendMessageService,
  getMessagesService,
  getUserConversationsService,
  getOrCreatePrivateConversationService,
  markMessagesAsReadService,
} from "../service/messagingService";
import { onlineUsers } from "..";

export const createConversation = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { participantIds, type, name } = req.body;
  const conversation = await createConversationService(userId, participantIds, type, name);
  res.status(201).json({ conversation });
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const user1 = req.user?.id!;
    const user2 = req.params.id;

    if (!user2) {
      res.status(400);
      throw new Error("User ID is required to get conversation");
    }

    const conversation = await getOrCreatePrivateConversationService(user1, user2);
    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found");
    }

    const messages = await getMessagesService(conversation.id, user1);

    res.status(200).json({ conversation, messages });
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500);
    throw new Error("Internal Server Error");
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.id!;
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400);
      throw new Error("Message content cannot be empty");
    }

    const message = await sendMessageService(senderId, conversationId, content);

    res.status(201).json({ message });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500);
    throw new Error("Internal Server Error");
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const conversationId = req.params.id;

    if (!conversationId) {
      res.status(400);
      throw new Error("Conversation ID is required to get messages");
    }

    const messages = await getMessagesService(conversationId, userId);

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500);
    throw new Error("Internal Server Error");
  }
};

export const getUserConversations = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const conversations = await getUserConversationsService(userId, onlineUsers);
  res.status(200).json({ conversations });
};

export const markConversationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const conversationId = req.params.id;

    if (!conversationId) {
      res.status(400);
      throw new Error("Conversation ID is required to mark messages as read");
    }

    await markMessagesAsReadService(conversationId, userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500);
    throw new Error("Internal Server Error");
  }
};
