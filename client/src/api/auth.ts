import { SignupPayload, User } from '@/interface/User';
import { axiosInstance } from '.';
import { urls } from './urls';

export const registerUser = async (userData: FormData) => {
	const response = await axiosInstance.post(urls.auth.register, userData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
	return response.data;
};

export const loginUser = async (email: string, password: string) => {
	const response = await axiosInstance.post(urls.auth.login, {
		email,
		password,
	});
	return response.data;
};

export const logoutUser = async () => {
	const response = await axiosInstance.post(urls.auth.logout);
	return response.data;
};

export const getUserById = async (userId: string, viewerId: string) => {
	const response = await axiosInstance.get(
		`${urls.auth.getById(userId)}?viewer=${viewerId}`
	);
	return response.data.user;
};
export const updateUser = async (updates: Partial<User>) => {
	const response = await axiosInstance.patch(urls.auth.update, updates);
	return response.data.user;
};

export const updateUserPassword = async (
	currentPassword: string,
	newPassword: string
) => {
	const response = await axiosInstance.patch(urls.auth.updatePassword, {
		currentPassword,
		newPassword,
	});
	return response.data;
};

export const sendFriendRequest = async (recipientId: string) => {
	const response = await axiosInstance.post(urls.auth.sendFriendRequest, {
		id: recipientId,
	});
	return response.data;
};

export const acceptFriendRequest = async (senderId: string) => {
	const response = await axiosInstance.post(urls.auth.acceptFriendRequest, {
		senderId,
		action: 'accept',
	});
	return response.data;
};

export const rejectFriendRequest = async (senderId: string) => {
	const response = await axiosInstance.post(urls.auth.rejectFriendRequest, {
		senderId,
		action: 'reject',
	});
	return response.data;
};

export const cancelFriendRequest = async (receivingUserId: string) => {
	const response = await axiosInstance.post(urls.auth.cancelFriendRequest, {
		receivingUserId,
	});
	return response.data;
};

export const removeFriend = async (friendId: string) => {
	const response = await axiosInstance.delete(urls.auth.removeFriend, {
		data: { friendId },
	});
	return response.data;
};

export const getUserFriends = async (userId: string) => {
	const response = await axiosInstance.get(urls.auth.getFriends(userId));
	return response.data.friends;
};

export const getFriendRequests = async () => {
	const response = await axiosInstance.get(urls.auth.getFriendRequests);
	return response.data.friendRequests;
};

export const getFriendSuggestions = async () => {
	const response = await axiosInstance.get(urls.auth.suggestFriends);
	return response.data.suggestions;
};

export const searchUsers = async (query: string) => {
	const response = await axiosInstance.get(urls.auth.searchUsers(query));
	return response.data.users;
};
