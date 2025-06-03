import { Request, Response } from "express";
import {
  createPostService,
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
} from "../service/postService";

export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401);
      throw new Error("Unauthorized: No token provided");
    }

    const payload = req.body;
    const { content, category } = payload;

    if (!content || content.trim() === "") {
      res.status(400);
      throw new Error("Post content is required");
    }

    if (!category || category.trim() === "") {
      res.status(400);
      throw new Error("Post category is required");
    }

    const post = await createPostService(userId, payload);

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400);
    throw new Error(err.message || "Failed to create post");
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

    const updatedComment = await togglePostLikeService(userId, commentId);

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
