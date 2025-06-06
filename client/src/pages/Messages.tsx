import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Send } from 'lucide-react';
import { Conversation, Message } from '@/types';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useConversationData } from '@/hooks/useConversationData';

const Messages: React.FC = () => {
	const { userId } = useParams();
	const { user } = useAuth();
	const queryClient = useQueryClient();

	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [activeConversation, setActiveConversation] =
		useState<Conversation | null>(null);

	const bottomOfMessagesRef = React.useRef<HTMLDivElement>(null);
	useEffect(() => {
		bottomOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, activeConversation]);

	const { socketRef, onlineUsers } = useSocket(user.id);
	const { conversation, conversationMessages, allConversations, markAsRead } =
		useConversationData(userId, activeConversation);

	useEffect(() => {
		socketRef.current?.on('new_message', (msg: Message) => {
			setMessages((prev) => [...prev, msg]);
		});

		socketRef.current?.on('update_conversations', () => {
			queryClient.invalidateQueries({ queryKey: ['conversations'] });
		});
	}, [queryClient, socketRef]);

	useEffect(() => {
		if (conversation.data) {
			const conv = conversation.data.conversation;
			setActiveConversation(conv);
			setMessages(conversation.data.messages || []);
			socketRef.current?.emit('join', conv.id);
		}
	}, [conversation.data, socketRef]);

	useEffect(() => {
		if (conversationMessages.data) {
			setMessages(conversationMessages.data);
		}
	}, [conversationMessages.data]);

	useEffect(() => {
		if (activeConversation && messages.length > 0) {
			markAsRead.mutate(activeConversation.id);
		}
	}, [activeConversation, messages.length]);

	const handleSelectConversation = (conv: Conversation) => {
		setActiveConversation(conv);
		socketRef.current?.emit('join', conv.id);
	};

	const handleSendMessage = () => {
		if (!newMessage.trim() || !activeConversation) return;
		socketRef.current?.emit('send_message', {
			senderId: user?.id,
			conversationId: activeConversation.id,
			content: newMessage,
		});
		setNewMessage('');
	};

	useEffect(() => {
		if (conversation.data) {
			const conv = conversation.data.conversation;
			setActiveConversation(conv);
			setMessages(conversation.data.messages || []);
			socketRef.current?.emit('join', conv.id);
		}
	}, [conversation.data, socketRef]);

	useEffect(() => {
		if (conversationMessages.data) {
			setMessages(conversationMessages.data);
		}
	}, [conversationMessages.data]);

	const filteredConversations = allConversations.data
		? allConversations.data.filter((conversation) =>
				conversation.participantName
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
		  )
		: [];

	// Format date for display
	const formatMessageTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const formatConversationTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			});
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString();
		}
	};

	return (
		<div className="container mx-auto p-2">
			<h1 className="text-2xl font-bold mb-4">Messages</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Conversations List */}
				<Card className="md:col-span-1 p-3">
					<div className="flex items-center mb-4 relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={16}
						/>
						<Input
							placeholder="Search conversations..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<ScrollArea className="h-[calc(80vh-120px)]">
						{filteredConversations.length > 0 ? (
							filteredConversations.map((conversation) => (
								<div key={conversation.id}>
									<div
										className={`flex items-center justify-between p-3 cursor-pointer transition-colors rounded-md ${
											activeConversation?.id === conversation.id
												? 'bg-purple-100'
												: 'hover:bg-gray-100'
										}`}
										onClick={() => handleSelectConversation(conversation)}
									>
										<div className="flex items-center space-x-3">
											<div className="relative">
												<img
													src={
														`http://localhost:5000${conversation.participantAvatar}` ||
														'https://sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png'
													}
													alt={conversation.participantName || 'User Avatar'}
													className="w-10 h-10 rounded-full object-cover"
												/>
												{onlineUsers.has(conversation.participantId) && (
													<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
												)}
											</div>
											<div>
												<div className="font-medium">
													{conversation.participantName}
												</div>
												<div className="text-sm text-gray-500 truncate max-w-[150px]">
													{conversation.lastMessage}
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="text-xs text-gray-500">
												{formatConversationTime(conversation.lastMessageTime)}
											</div>
											{conversation.unreadCount > 0 && (
												<div className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-1">
													{conversation.unreadCount}
												</div>
											)}
										</div>
									</div>
									<Separator />
								</div>
							))
						) : (
							<div className="p-4 text-center text-gray-500">
								No conversations found
							</div>
						)}
					</ScrollArea>
				</Card>

				{/* Messages Area */}
				<Card className="md:col-span-2 flex flex-col h-[80vh]">
					{activeConversation ? (
						<>
							{/* Conversation Header */}
							<div className="p-3 border-b flex items-center space-x-3">
								<div className="relative">
									<img
										src={`http://localhost:5000${activeConversation.participantAvatar}`}
										alt={activeConversation.participantName}
										className="w-10 h-10 rounded-full object-cover"
									/>
									{activeConversation.online && (
										<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
									)}
								</div>
								<div>
									<div className="font-medium">
										{activeConversation.participantName}
									</div>
									<div className="text-xs text-gray-500">
										{activeConversation.online ? 'Online' : 'Offline'}
									</div>
								</div>
							</div>

							{/* Messages */}
							<ScrollArea className="flex-grow p-4">
								<div className="space-y-4">
									{messages.map((message) => {
										const isCurrentUser = message.senderId === user?.id;

										return (
											<div
												key={message.id}
												className={`flex ${
													isCurrentUser ? 'justify-end' : 'justify-start'
												}`}
											>
												<div
													className={`max-w-[70%] p-3 rounded-lg ${
														isCurrentUser
															? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
															: 'bg-gray-100'
													}`}
												>
													<div>{message.content}</div>
													<div
														className={`text-xs mt-1 ${
															isCurrentUser
																? 'text-purple-100'
																: 'text-gray-500'
														}`}
													>
														{formatMessageTime(message.createdAt)}
													</div>
												</div>
											</div>
										);
									})}
									<div ref={bottomOfMessagesRef}></div>
								</div>
							</ScrollArea>

							{/* Message Input */}
							<div className="p-3 border-t">
								<div className="flex items-center space-x-2">
									<Input
										placeholder="Type a message..."
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !e.shiftKey) {
												e.preventDefault();
												handleSendMessage();
											}
										}}
										className="flex-grow"
									/>
									<Button
										onClick={handleSendMessage}
										disabled={!newMessage.trim()}
										className="bg-gradient-to-r from-purple-600 to-blue-600"
									>
										<Send size={16} />
									</Button>
								</div>
							</div>
						</>
					) : (
						<div className="flex-grow flex flex-col items-center justify-center text-gray-500">
							<div className="text-center">
								<div className="text-5xl mb-2">💬</div>
								<h3 className="text-xl font-semibold mb-2">Your Messages</h3>
								<p className="max-w-sm">
									Select a conversation to start chatting
								</p>
							</div>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
};

export default Messages;
