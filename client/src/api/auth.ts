import { SignupPayload, User } from "@/interface/User";
import { axiosInstance } from ".";
import { urls } from "./urls";

export const registerUser = async (userData: SignupPayload) => {
  const response = await axiosInstance.post(urls.auth.register, {
    ...userData,
    profile_picture: "https://www.svgrepo.com/show/452030/avatar-default.svg",
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

export const getUserById = async (id: string) => {
  const response = await axiosInstance.get(urls.auth.getById(id));
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

export const acceptFriendRequest = async (requestId: string) => {
  const response = await axiosInstance.post(urls.auth.acceptFriendRequest, {
    requestId,
    action: "accept",
  });
  return response.data;
};

export const rejectFriendRequest = async (requestId: string) => {
  const response = await axiosInstance.post(urls.auth.rejectFriendRequest, {
    requestId,
    action: "reject",
  });
  return response.data;
};

export const cancelFriendRequest = async (requestId: string) => {
  const response = await axiosInstance.post(urls.auth.cancelFriendRequest, {
    requestId,
  });
  return response.data;
};

export const getUserFriends = async (userId: string) => {
  const response = await axiosInstance.get(urls.auth.getFriends(userId));
  return response.data.friends;
};
