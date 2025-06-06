import { PostPayload } from '@/interface/Post';
import { axiosInstance } from '.';
import { urls } from './urls';

export const createPost = async (formData: FormData) => {
	const response = await axiosInstance.post(urls.posts.create, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
	return response.data.post;
};

export const createGroupPost = async (groupId: string, formData: FormData) => {
	const response = await axiosInstance.post(
		urls.posts.createGroupPost(groupId), // ✅ use URL builder
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		}
	);
	return response.data.post;
};
export const getAllPosts = async () => {
	const response = await axiosInstance.get(urls.posts.getAll);
	return response.data.posts;
};

export const getLatestFeed = async () => {
	const response = await axiosInstance.get(urls.posts.getLatestFeed);
	return response.data.posts;
};

export const getDiscoverFeed = async () => {
	const response = await axiosInstance.get(urls.posts.getDiscoverFeed);
	return response.data.posts;
};

export const getPostsByUserId = async (userId: string) => {
	const response = await axiosInstance.get(urls.posts.getByUserId(userId));
	return response.data.posts;
};

export const getPostById = async (id: string) => {
	const response = await axiosInstance.get(urls.posts.getById(id));
	return response.data.post;
};

export const togglePostLike = async (id: string) => {
	const response = await axiosInstance.patch(urls.posts.toggleLike(id));
	return response.data.post;
};
export const createComment = async (postId: string, content: string) => {
	const response = await axiosInstance.post(urls.posts.createComment(postId), {
		content,
	});
	return response.data.comment;
};
export const toggleCommentLike = async (commentId: string) => {
	const response = await axiosInstance.patch(
		urls.posts.toggleCommentLike(commentId)
	);
	return response.data.comment;
};
