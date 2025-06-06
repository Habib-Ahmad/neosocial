import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (userId: string | undefined | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!userId) return;
    const socket = io("http://localhost:5000", {
      withCredentials: true,
      auth: { userId },
    });
    socketRef.current = socket;

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    socket.on("user_online", (id: string) => {
      setOnlineUsers((prev) => new Set(prev).add(id));
    });

    socket.on("user_offline", (id: string) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setOnlineUsers(new Set());
    };
  }, [userId]);

  return { socketRef, onlineUsers };
};
