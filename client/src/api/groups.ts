import { axiosInstance } from '.';
import { urls } from './urls';

export const createGroup = async (formData: FormData) => {
	const response = await axiosInstance.post(urls.groups.create, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return response.data.group;
};

export const getGroupMembers = async (groupId: string) => {
	const response = await axiosInstance.get(urls.groups.getMembers(groupId));
	return response.data.members;
};

export const submitJoinRequest = async (groupId: string) => {
	const response = await axiosInstance.post(urls.groups.join(groupId));
	return response.data.request;
};

export const getPendingRequests = async (groupId: string) => {
	const response = await axiosInstance.get(
		urls.groups.getPendingRequests(groupId)
	);
	return response.data.requests;
};

export const reviewJoinRequest = async (
	groupId: string,
	requestId: string,
	status: 'accepted' | 'rejected'
) => {
	const response = await axiosInstance.patch(
		urls.groups.reviewJoinRequest(groupId, requestId),
		{ status }
	);
	return response.data.updatedRequest;
};

export const searchGroups = async (query: string) => {
	const response = await axiosInstance.get(urls.groups.search(query));
	return response.data.groups;
};

export const createGroupPost = async (groupId: string, formData: FormData) => {
	const response = await axiosInstance.post(
		urls.groups.createGroupPost(groupId),
		formData,
		{
			headers: { 'Content-Type': 'multipart/form-data' },
		}
	);
	return response.data.post;
};

export const getUserGroups = async () => {
	const response = await axiosInstance.get(urls.groups.getUserGroups);
	return response.data.groups;
};
