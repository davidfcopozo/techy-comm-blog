import mongoose from "mongoose";
import { PostViewInterface } from "../typings/models/postView";

const postViewSchema = new mongoose.Schema<PostViewInterface>(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      // Optional for anonymous views
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ipAddress: {
      // For tracking anonymous views
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      enum: ["direct", "search", "social", "referral", "email"],
      default: "direct",
    },
    referrer: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
    },
    viewDuration: {
      // in seconds
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
postViewSchema.index({ post: 1, createdAt: -1 });
postViewSchema.index({ user: 1, createdAt: -1 });
postViewSchema.index({ createdAt: -1 });
postViewSchema.index({ post: 1, user: 1 });
postViewSchema.index({ post: 1, ipAddress: 1 });

const PostView = mongoose.model("PostView", postViewSchema);

export default PostView;
