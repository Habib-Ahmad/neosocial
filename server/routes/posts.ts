import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostsByUserId,
  getUserFeed,
  togglePostLike,
  updatePost,
} from "../controllers/postController";

const router = express.Router();

router.post("/", validateToken, createPost);
router.get("/", validateToken, getAllPosts);
router.get("/:id", validateToken, getPostById);
router.get("/feed", validateToken, getUserFeed);
router.get("/user/:id", validateToken, getPostsByUserId);
router.patch("/:id/like", validateToken, togglePostLike);
router.patch("/:id", validateToken, updatePost);
router.delete("/:id", validateToken, deletePost);

export default router;
