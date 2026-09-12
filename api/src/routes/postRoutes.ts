import express from "express";
const router = express.Router();
import { auth } from "../middleware/auth";
import { optionalAuth } from "../middleware/optional-auth";
import {
  createPost,
  getAllPosts,
  updatePostBySlugOrId,
  deletePostBySlugOrId,
  toggleLike,
  toggleBookmark,
  sharePost,
  getPostBySlugOrId,
  getPostsByCategory,
  previewPost,
  getUserPosts,
} from "../controllers/postController";
import { recordPostView } from "../controllers/analyticsController";

router.route("/").get(optionalAuth, getAllPosts).post(auth, createPost);
router.route("/my-posts").get(auth, getUserPosts);
router.route("/like").put(auth, toggleLike);
router.route("/bookmark").put(auth, toggleBookmark);
router.route("/share").post(optionalAuth, sharePost);
router.route("/preview/:slugOrId").get(auth, previewPost);
router.route("/category/:category").get(optionalAuth, getPostsByCategory);
router.post("/:postId/views", optionalAuth, recordPostView);
router
  .route("/:slugOrId")
  .get(optionalAuth, getPostBySlugOrId)
  .patch(auth, updatePostBySlugOrId)
  .delete(auth, deletePostBySlugOrId);

export default router;
