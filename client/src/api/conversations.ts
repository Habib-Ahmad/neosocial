import { axiosInstance } from ".";
import { urls } from "./urls";

export const getUserConversations = async () => {
  const response = await axiosInstance.get(urls.messaging.getUserConversations);
  return response.data.conversations;
};

export const getConversation = async (userId: string) => {
  const response = await axiosInstance.get(
    urls.messaging.getConversation(userId)
  );
  return response.data;
};

export const sendMessage = async (conversationId: string, content: string) => {
  const response = await axiosInstance.post(
    urls.messaging.sendMessage(conversationId),
    { content }
  );
  return response.data.message;
};

export const getConversationMessages = async (conversationId: string) => {
  const response = await axiosInstance.get(
    urls.messaging.getConversationMessages(conversationId)
  );
  return response.data.messages;
};

export const markConversationAsRead = async (conversationId: string) => {
  const response = await axiosInstance.post(
    urls.messaging.markConversationAsRead(conversationId)
  );
  return response.data;
};
