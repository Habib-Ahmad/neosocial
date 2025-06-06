export interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  reposts: number;
  image?: string;
  category?: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
  mutualFriends: number;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "friend_request" | "mention";
  message: string;
  time: string;
  read: boolean;
  avatar: string;
}

export interface FriendRequest {
  id: string;
  from: {
    id: string;
    name: string;
    avatar: string;
  };
  to: {
    id: string;
    name: string;
    avatar: string;
  };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
}
