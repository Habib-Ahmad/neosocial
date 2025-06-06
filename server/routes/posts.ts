import express from "express";
import { validateToken } from "../middleware/validateToken";
import { postUpload } from "../middleware/postUpload";

import {
  createPost,
  deletePost,
  getLatestFeed,
  getPostById,
  getPostsByUserId,
  getDiscoverFeed,
  togglePostLike,
  updatePost,
  getCommentsForPost,
  createCommentForPost,
  toggleCommentLike,
  createGroupPost,
} from "../controllers/postController";

const router = express.Router();

router.post("/", validateToken, postUpload.array("media"), createPost);
router.post("/:groupId", validateToken, postUpload.array("media"), createGroupPost);
router.get("/latest", validateToken, getLatestFeed);
router.get("/discover", validateToken, getDiscoverFeed);
router.get("/:id", validateToken, getPostById);
router.get("/user/:id", validateToken, getPostsByUserId);
router.patch("/:id/like", validateToken, togglePostLike);
router.patch("/:id", validateToken, updatePost);
router.delete("/:id", validateToken, deletePost);
router.post("/:id/comments", validateToken, createCommentForPost);
router.get("/:id/comments", validateToken, getCommentsForPost);
router.patch("/:id/comments/like", validateToken, toggleCommentLike);

export default router;
