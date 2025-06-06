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

export const updateGroup = async (groupId: string, formData: any) => {
	const response = await axiosInstance.patch(
		urls.groups.updateGroup(groupId),
		formData
	);
	return response.data.group;
};

export const submitJoinRequest = async (groupId: string) => {
	const response = await axiosInstance.post(urls.groups.join(groupId));
	return response.data.request;
};

export const getSentJoinRequests = async () => {
	const response = await axiosInstance.get(urls.groups.getSentRequests());
	return response.data.requests;
};

export const getReceivedJoinRequests = async () => {
	const response = await axiosInstance.get(urls.groups.getReceivedRequests());
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

export const getUserGroups = async () => {
	const response = await axiosInstance.get(urls.groups.getUserGroups);
	return response.data.groups;
};
export const getGroupDetails = async (groupId: string) => {
	const response = await axiosInstance.get(urls.groups.getGroupById(groupId));
	return response.data; // Includes group, members, posts, isAdmin, isMember, hasRequested, isPublic
};
export const leaveGroup = async (groupId: string) => {
	const response = await axiosInstance.delete(urls.groups.leave(groupId));
	return response.data.group;
};
export const acceptJoinRequest = async (requestId: string) => {
	const response = await axiosInstance.patch(
		urls.groups.acceptJoinRequest(requestId)
	);
	return response.data.group;
};
export const removeGroupMember = async (groupId: string, memberId: string) => {
	const response = await axiosInstance.delete(
		urls.groups.removeMember(groupId, memberId)
	);
	return response.data.message;
};

export const rejectJoinRequest = async (requestId: string) => {
	const response = await axiosInstance.patch(
		urls.groups.rejectJoinRequest(requestId)
	);
	return response.data.group;
};

export const cancelJoinRequest = async (requestId: string) => {
	const response = await axiosInstance.delete(
		urls.groups.cancelJoinRequest(requestId)
	);
	return response.data.message;
};
export const suggestGroups = async () => {
	const response = await axiosInstance.get(urls.groups.suggestGroups);
	return response.data.groups;
};
