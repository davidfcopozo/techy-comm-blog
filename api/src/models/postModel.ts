import mongoose, { model } from "mongoose";
import { PostInterface } from "../typings/models/post";
const { Schema } = mongoose;

const DEFAULT_COVER_IMAGE =
  process.env.DEFAULT_COVER_IMAGE || "/default-image.jpg";

const postSchema = new Schema<PostInterface>(
  {
    title: { type: String },
    content: { type: String },
    slug: { type: String, required: [true, "Slug is required"] },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: {
      type: String,
      public_id: String,
      default: () => DEFAULT_COVER_IMAGE,
      set: (value: string | null | undefined) => {
        if (
          !value ||
          value.trim() === "" ||
          value.includes("fallback-featured-image.webp")
        ) {
          return DEFAULT_COVER_IMAGE;
        }
        return value;
      },
    },

    tags: [{ type: String }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    status: {
      type: String,
      enum: ["draft", "published", "unpublished"],
      default: "draft",
    },
    visits: { type: Number, default: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

postSchema.virtual("likesCount", {
  ref: "PostLike",
  localField: "_id",
  foreignField: "post",
  count: true,
  match: { isActive: true },
  justOne: false,
});

postSchema.virtual("bookmarksCount", {
  ref: "PostBookmark",
  localField: "_id",
  foreignField: "post",
  count: true,
  match: { isActive: true },
  justOne: false,
});

postSchema.virtual("viewsCount", {
  ref: "PostView",
  localField: "_id",
  foreignField: "post",
  count: true,
  justOne: false,
});

postSchema.virtual("sharesCount", {
  ref: "PostShare",
  localField: "_id",
  foreignField: "post",
  count: true,
  match: { isActive: true },
  justOne: false,
});

postSchema.methods.populateAnalytics = async function () {
  await this.populate([
    { path: "likesCount" },
    { path: "bookmarksCount" },
    { path: "viewsCount" },
    { path: "sharesCount" },
  ]);
  return this;
};

// Ensure virtual fields are serialized
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

//prefetch categories
postSchema.pre("find", function (next) {
  this.populate("categories");
  next();
});

const Post = model("Post", postSchema);

export default Post;
