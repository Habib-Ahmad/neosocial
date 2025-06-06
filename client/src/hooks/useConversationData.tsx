import {
  getConversation,
  getConversationMessages,
  getUserConversations,
  markConversationAsRead,
} from "@/api/conversations";
import { Conversation } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useConversationData = (
  userId: string | undefined,
  activeConversation: Conversation | null
) => {
  const queryClient = useQueryClient();

  const conversation = useQuery({
    queryKey: [`conversation/${userId}`],
    queryFn: () => getConversation(userId),
    enabled: !!userId,
  });

  const conversationMessages = useQuery({
    queryKey: [`conversationMessages/${activeConversation?.id}`],
    queryFn: () =>
      activeConversation
        ? getConversationMessages(activeConversation.id)
        : Promise.resolve([]),
    enabled: !!activeConversation,
  });

  const allConversations = useQuery({
    queryKey: ["conversations"],
    queryFn: getUserConversations,
  });

  const markAsRead = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`conversationMessages/${activeConversation?.id}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`conversation/${activeConversation?.id}`],
      });
    },
  });

  return { conversation, conversationMessages, allConversations, markAsRead };
};
