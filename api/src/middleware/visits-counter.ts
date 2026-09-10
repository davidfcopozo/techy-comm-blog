import Post from "../models/postModel";
import { Response, NextFunction } from "express";
import { RequestWithUserInfo } from "../typings/models/user";
import { NotFound } from "../errors/index";
import { PostType } from "../typings/types";
import mongoose from "mongoose";
import { AnalyticsService } from "../utils/analyticsService";

export const visitsCounter = async (
  req: RequestWithUserInfo | any,
  _res: Response,
  next: NextFunction
) => {
  const { slugOrId } = req.params;

  try {
    // 1. Skip if requested for editing, previewing, or metadata generation
    const isEditMode =
      req.query.mode === "edit" ||
      req.headers["x-view-mode"] === "edit" ||
      req.get("referer")?.includes("/edit-post/");

    const isPreviewMode =
      req.query.preview === "true" ||
      req.headers["x-view-mode"] === "preview" ||
      req.get("referer")?.includes("/preview/");

    const isMetadata =
      req.query.skipCount === "true" ||
      req.headers["x-skip-view-count"] === "true" ||
      req.headers["x-purpose"] === "metadata";

    if (isEditMode || isPreviewMode || isMetadata) {
      return next();
    }

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

    // Only count views on published posts
    if (post.status !== "published") {
      return next();
    }

    // 2. Resolve post author and requesting user
    const postAuthorId =
      (post?.postedBy as any)?._id?.toString() || post?.postedBy?.toString();
    const currentUserId =
      req.userId ||
      req.user?.userId ||
      req.user?.id ||
      req.user?.sub ||
      (req.headers["x-user-id"] as string);

    // STRICT RULE: Under no circumstances can a post owner add up a post view count
    if (
      currentUserId &&
      postAuthorId &&
      currentUserId.toString() === postAuthorId.toString()
    ) {
      return next();
    }

    // 3. Resolve client connection details (accounting for reverse proxies)
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress;
    const userAgent = req.get("User-Agent");
    const referrer = req.get("Referrer") || req.get("referer");
    const sessionId =
      (req.headers["x-session-id"] as string) ||
      (req.query.sessionId as string);

    // 4. Record unique visitor view (only increments visits if this visitor is unique)
    await AnalyticsService.recordPostView({
      postId: post._id.toString(),
      userId: currentUserId,
      ipAddress,
      userAgent,
      referrer,
      sessionId,
      source: referrer ? "referral" : "direct",
    });

    next();
  } catch (err) {
    if (err instanceof NotFound) {
      return next(err);
    }
    console.error("Error in visitsCounter middleware:", err);
    next();
  }
};
