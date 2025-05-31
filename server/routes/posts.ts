import express from "express";
import { validateToken } from "../middleware/validateToken";
import {
  createPost,
  deletePost,
  getLatestFeed,
  getPostById,
  getPostsByUserId,
  getDiscoverFeed,
  togglePostLike,
  updatePost,
} from "../controllers/postController";

const router = express.Router();

router.post("/", validateToken, createPost);
router.get("/latest", validateToken, getLatestFeed);
router.get("/discover", validateToken, getDiscoverFeed);
router.get("/:id", validateToken, getPostById);
router.get("/user/:id", validateToken, getPostsByUserId);
router.patch("/:id/like", validateToken, togglePostLike);
router.patch("/:id", validateToken, updatePost);
router.delete("/:id", validateToken, deletePost);

export default router;
