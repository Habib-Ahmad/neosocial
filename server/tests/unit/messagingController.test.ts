import { Request, Response } from "express";
import * as messagingService from "../../service/messagingService";

jest.mock("../../service/messagingService");
jest.mock("../../index", () => ({
  onlineUsers: new Map(),
}));

import {
  createConversation,
  getConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  markConversationAsRead,
} from "../../controllers/messagingController";

describe("Messaging Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
      body: {},
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

  describe("createConversation", () => {
    it("should create a conversation successfully", async () => {
      req.body = {
        participantIds: ["user456"],
        type: "private",
        name: null,
      };

      const mockConversation = { id: "conv123", participantIds: ["user123", "user456"] };
      (messagingService.createConversationService as any).mockResolvedValue(mockConversation);

      await createConversation(req as Request, res as Response);

      expect(messagingService.createConversationService).toHaveBeenCalledWith(
        "user123",
        ["user456"],
        "private",
        null
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ conversation: mockConversation });
    });
  });

  describe("getConversation", () => {
    it("should get conversation and messages successfully", async () => {
      req.params = { id: "user456" };
      const mockConversation = { id: "conv123" };
      const mockMessages = [{ id: "msg1", content: "Hello" }];

      (messagingService.getOrCreatePrivateConversationService as any).mockResolvedValue(mockConversation);
      (messagingService.getMessagesService as any).mockResolvedValue(mockMessages);

      await getConversation(req as Request, res as Response);

      expect(messagingService.getOrCreatePrivateConversationService).toHaveBeenCalledWith("user123", "user456");
      expect(messagingService.getMessagesService).toHaveBeenCalledWith("conv123", "user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        conversation: mockConversation,
        messages: mockMessages,
      });
    });

    it("should return 500 if user ID is missing", async () => {
      req.params = {};

      await expect(getConversation(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 if conversation not found", async () => {
      req.params = { id: "user456" };
      (messagingService.getOrCreatePrivateConversationService as any).mockResolvedValue(null);

      await expect(getConversation(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      req.params = { id: "conv123" };
      req.body = { content: "Hello world" };

      const mockMessage = { id: "msg1", content: "Hello world", senderId: "user123" };
      (messagingService.sendMessageService as any).mockResolvedValue(mockMessage);

      await sendMessage(req as Request, res as Response);

      expect(messagingService.sendMessageService).toHaveBeenCalledWith("user123", "conv123", "Hello world");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: mockMessage });
    });

    it("should return 500 if content is empty", async () => {
      req.params = { id: "conv123" };
      req.body = { content: "   " };

      await expect(sendMessage(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should return 500 if content is missing", async () => {
      req.params = { id: "conv123" };
      req.body = {};

      await expect(sendMessage(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getMessages", () => {
    it("should get messages successfully", async () => {
      req.params = { id: "conv123" };
      const mockMessages = [
        { id: "msg1", content: "Hi" },
        { id: "msg2", content: "Hello" },
      ];

      (messagingService.getMessagesService as any).mockResolvedValue(mockMessages);

      await getMessages(req as Request, res as Response);

      expect(messagingService.getMessagesService).toHaveBeenCalledWith("conv123", "user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ messages: mockMessages });
    });

    it("should return 500 if conversation ID is missing", async () => {
      req.params = {};

      await expect(getMessages(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getUserConversations", () => {
    it("should get user conversations successfully", async () => {
      const mockConversations = [
        { id: "conv1", lastMessage: "Hi" },
        { id: "conv2", lastMessage: "Hello" },
      ];

      (messagingService.getUserConversationsService as any).mockResolvedValue(mockConversations);

      await getUserConversations(req as Request, res as Response);

      expect(messagingService.getUserConversationsService).toHaveBeenCalledWith("user123", expect.any(Map));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ conversations: mockConversations });
    });
  });

  describe("markConversationAsRead", () => {
    it("should mark conversation as read successfully", async () => {
      req.params = { id: "conv123" };
      (messagingService.markMessagesAsReadService as any).mockResolvedValue(undefined);

      await markConversationAsRead(req as Request, res as Response);

      expect(messagingService.markMessagesAsReadService).toHaveBeenCalledWith("conv123", "user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should return 500 if conversation ID is missing", async () => {
      req.params = {};

      await expect(markConversationAsRead(req as Request, res as Response)).rejects.toThrow("Internal Server Error");
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
