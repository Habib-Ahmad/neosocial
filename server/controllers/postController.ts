import { Request, Response } from "express";
import {
  createPostService,
  createGroupPostService,
  deletePostService,
  getLatestFeedService,
  getPostByIdService,
  getPostsByUserIdService,
  getDiscoverFeedService,
  togglePostLikeService,
  toggleCommentLikeService,
  updatePostService,
  createCommentForPostService,
  getCommentsForPostService,
  getRepostedPostsByUserIdService,
  repostPostService,
} from "../service/postService";
export const createGroupPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const groupId = req.params.groupId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { content, category } = req.body;
    if (!content?.trim() || !category?.trim()) {
      res.status(400).json({ message: "Content and category required" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const mediaUrls = files?.map((file) => `/uploads/posts/${file.filename}`) || [];

    const post = await createGroupPostService(userId, groupId, {
      content,
      category,
      mediaUrls,
    });

    res.status(201).json({ message: "Group post created successfully", post });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create group post" });
  }
};

export const getRepostedPostsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const viewerId = req.params.viewerId || userId; // Default to logged-in user if viewerId is not passed in the URL

    // Check if the user is logged in
    if (!userId) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    // If no viewerId is found (this should not happen if you pass viewerId in the params), handle the error
    if (!viewerId) {
      res.status(400).json({ message: "Viewer ID is required" });
      return;
    }

    // Get reposted posts for the user, passing userId and viewerId
    const repostedPosts = await getRepostedPostsByUserIdService(userId, viewerId);

    // Return the reposted posts
    res.status(200).json({
      message: "Fetched reposted posts successfully",
      repostedPosts,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch reposted posts" });
  }
};
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { content, category } = req.body;
    if (!content?.trim() || !category?.trim()) {
      res.status(400).json({ message: "Content and category required" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const mediaUrls = files?.map((file) => `/uploads/posts/${file.filename}`) || [];

    const post = await createPostService(userId, {
      content,
      category,
      mediaUrls,
    });

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create post" });
  }
};

export const getDiscoverFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const posts = await getDiscoverFeedService(userId);

    res.status(200).json({
      message: "Fetched all posts successfully",
      posts,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to fetch posts");
  }
};

export const getLatestFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }
    const posts = await getLatestFeedService(userId);

    res.status(200).json({
      message: "Fetched all posts successfully",
      posts,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to fetch posts");
  }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const targetUserId = req.params.id;
    if (!targetUserId) {
      res.status(400);
      throw new Error("User ID is required");
    }

    const posts = await getPostsByUserIdService(targetUserId, userId);

    res.status(200).json({
      message: "Fetched user posts successfully",
      posts,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to fetch user posts");
  }
};
export const repostPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id; // Get the post ID from URL parameters

    if (!userId) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    // Call the service to repost the post
    const repostResponse = await repostPostService(userId, postId);

    res.status(200).json({ message: repostResponse.message });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message || "Failed to repost" });
  }
};
export const getPostById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }
    const postId = req.params.id;
    const post = await getPostByIdService(postId, userId);

    if (!post || post.is_deleted) {
      res.status(404);
      throw new Error("Post not found");
    }

    res.status(200).json({ message: "Post fetched successfully", post });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to fetch post");
  }
};

export const togglePostLike = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id;

    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const updatedPost = await togglePostLikeService(userId, postId);

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to update post");
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id;

    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const updatedPost = await updatePostService(userId, postId, { content: req.body.content });

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to update post");
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id;

    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const success = await deletePostService(userId, postId);

    if (!success) {
      res.status(404);
      throw new Error("Post not found or already deleted");
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting post:", err);
    res.status(400);
    throw new Error(err.message || "Failed to delete post");
  }
};
export const createCommentForPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id;
    const { content } = req.body;

    if (!userId || !content) {
      res.status(400).json({ error: "Missing user or content" });
      return;
    }

    const comment = await createCommentForPostService(userId, postId, content);
    res.status(201).json({ message: "Comment created", comment });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to create comment" });
  }
};

export const getCommentsForPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const comments = await getCommentsForPostService(postId, userId);
    res.status(200).json({ message: "Comments fetched", comments });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to fetch comments" });
  }
};

export const toggleCommentLike = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const commentId = req.params.id;

    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const updatedComment = await toggleCommentLikeService(userId, commentId);

    res.status(200).json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to update comment");
  }
};
