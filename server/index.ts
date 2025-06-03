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
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`📥 Joined conversation ${conversationId}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, conversationId, content } = data;
    const message = await sendMessageService(senderId, conversationId, content);
    io.to(conversationId).emit("new_message", message);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: ["http://localhost:8080", "http://localhost:8081"],
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
