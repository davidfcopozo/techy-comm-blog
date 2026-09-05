import Post from "../models/postModel";

import { Response, NextFunction } from "express";
import { RequestWithUserInfo } from "../typings/models/user";
import { NotFound } from "../errors/index";
import { PostType } from "../typings/types";
import mongoose from "mongoose";

export const visitsCounter = async (
  req: RequestWithUserInfo | any,
  _res: Response,
  next: NextFunction
) => {
  const { slugOrId } = req.params;

  try {
    let post: PostType | null;

    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      post = await Post.findById(slugOrId).populate("postedBy");
    } else {
      post = await Post.findOne({
        $or: [{ slug: slugOrId }, { slug: slugOrId.toLowerCase() }],
      }).populate("postedBy");
    }

    if (!post) {
      throw new NotFound("Post not found");
    }

    const postAuthorId =
      (post?.postedBy as any)?._id?.toString() || post?.postedBy?.toString();
    const currentUserId = req.userId || req.user?.userId;

    if (
      post &&
      post.status === "published" &&
      postAuthorId !== currentUserId
    ) {
      await Post.findByIdAndUpdate(
        post._id,
        { $inc: { visits: 1 } },
        { new: true }
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
