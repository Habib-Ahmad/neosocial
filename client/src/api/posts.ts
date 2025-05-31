import { PostPayload } from "@/interface/Post";
import { axiosInstance } from ".";
import { urls } from "./urls";

export const createPost = async (payload: PostPayload) => {
  const response = await axiosInstance.post(urls.posts.create, payload);
  return response.data;
};

export const getAllPosts = async () => {
  const response = await axiosInstance.get(urls.posts.getAll);
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
