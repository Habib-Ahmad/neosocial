import { Request, Response } from "express";
import {
  createConversationService,
  sendMessageService,
  getMessagesService,
  getUserConversationsService,
} from "../service/messagingService";

export const createConversation = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { participantIds, type, name } = req.body;
  const conversation = await createConversationService(userId, participantIds, type, name);
  res.status(201).json({ conversation });
};

export const sendMessage = async (req: Request, res: Response) => {
  const senderId = req.user?.id!;
  const { content } = req.body;
  const conversationId = req.params.id;
  const message = await sendMessageService(senderId, conversationId, content);
  res.status(201).json({ message });
};

export const getMessages = async (req: Request, res: Response) => {
  const messages = await getMessagesService(req.params.id);
  res.status(200).json({ messages });
};

export const getUserConversations = async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const conversations = await getUserConversationsService(userId);
  res.status(200).json({ conversations });
};
