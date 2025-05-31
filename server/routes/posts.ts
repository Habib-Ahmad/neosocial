import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getUserFeed,
  togglePostLike,
  updatePost,
  getCommentsForPost,
  createCommentForPost,
} from "../controllers/postController";

const router = express.Router();

router.post("/", validateToken, createPost);
router.get("/", validateToken, getAllPosts);
router.get("/:id", validateToken, getPostById);
router.get("/feed", validateToken, getUserFeed);
router.patch("/:id/like", validateToken, togglePostLike);
router.patch("/:id", validateToken, updatePost);
router.delete("/:id", validateToken, deletePost);
router.post("/:id/comments", validateToken, createCommentForPost);
router.get("/:id/comments", validateToken, getCommentsForPost);

export default router;
