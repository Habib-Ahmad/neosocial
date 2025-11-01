import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { postRouter, userRouter, groupRouter, messagesRouter, notificationRouter } from "./routes";
import errorHandler from "./middleware/errorHandler";
import { constants } from "./utils/constants";
import { sendMessageService } from "./service/messagingService";
import path from "path";

dotenv.config();
const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ["https://neosocial.onrender.com", "http://localhost:8080"],
    credentials: true,
  },
});

// Socket.IO logic
export const userSocketMap: Record<string, string> = {}; // userId -> socketId
export const onlineUsers: Record<string, string> = {}; // userId -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  const userId = socket.handshake.auth?.userId;
  if (!userId) {
    console.warn("⚠️ Missing userId in handshake");
    socket.disconnect();
    return;
  }

  onlineUsers[userId] = socket.id;
  userSocketMap[userId] = socket.id;
  console.log(`🟢 ${userId} is online`);
  socket.emit("online_users", Object.keys(onlineUsers));
  io.emit("user_online", userId);

  socket.on("join", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`📥 ${userId} joined conversation ${conversationId}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, conversationId, content } = data;
    if (!content?.trim() || !senderId || !conversationId) return;

    try {
      const { message, receiverId } = await sendMessageService(senderId, conversationId, content);

      io.to(conversationId).emit("new_message", message);

      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("update_conversations");
      }
    } catch (err) {
      console.error("❌ Message send failed:", err);
      socket.emit("error_message", "Message failed to send");
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);

    const userIdToRemove = Object.entries(onlineUsers).find(
      ([, socketId]) => socketId === socket.id
    )?.[0];

    if (userIdToRemove) {
      delete onlineUsers[userIdToRemove];
      delete userSocketMap[userIdToRemove];
      console.log(`🔴 ${userIdToRemove} went offline`);
      io.emit("user_offline", userIdToRemove);
    }
  });
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: ["https://neosocial.onrender.com", "http://localhost:8080"],
  })
);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the NeoSocial API");
});

app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/notifications", notificationRouter);
app.use("/uploads/posts", express.static(path.join(process.cwd(), "uploads", "posts")));
app.use("/uploads/users", express.static(path.join(process.cwd(), "uploads", "users")));
app.use("/uploads/groups", express.static(path.join(process.cwd(), "uploads", "groups")));

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(constants.NOT_FOUND);
  const error = new Error("Not Found");
  next(error);
});

// Error handler
app.use(errorHandler(false));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
