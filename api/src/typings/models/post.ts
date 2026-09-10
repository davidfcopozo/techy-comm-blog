import mongoose from "mongoose";
import { CategoryInterface } from "./category";

export interface PostInterface {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  slug: string;
  postedBy: mongoose.Schema.Types.ObjectId;
  coverImage?: string;
  excerpt?: string;
  tags?: string[];
  categories?: CategoryInterface[];
  visits?: number;
  comments?: mongoose.Schema.Types.ObjectId[];
  status: "draft" | "published" | "unpublished";
  // Virtual fields (not stored in DB)
  likesCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
