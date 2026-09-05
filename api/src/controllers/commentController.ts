import Comment from "../models/commentModel";
import Post from "../models/postModel";
import User from "../models/userModel";
import { v4 as uuidv4 } from "uuid";

import { NextFunction, Response } from "express";
import { RequestWithUserInfo } from "../typings/models/user";
import { StatusCodes } from "http-status-codes";
import { NotFound } from "../errors/not-found";
import { BadRequest } from "../errors/bad-request";
import { CommentType, PostMongooseType, PostType } from "../typings/types";
import { sanitizeContent } from "../utils/sanitize-content";
import { NotificationService } from "../utils/notificationService";
import { AnalyticsService } from "../utils/analyticsService";

// Cache for preventing duplicate like requests
const likeRequestCache = new Map<string, number>();
const requestCountCache = new Map<string, number>();

const isDuplicateLikeRequest = (userId: string, commentId: string): boolean => {
  const key = `${userId}-${commentId}`;
  const now = Date.now();
  const lastRequest = likeRequestCache.get(key);

  // Count requests per minute
  const countKey = `count-${key}-${Math.floor(now / 60000)}`;
  const currentCount = requestCountCache.get(countKey) || 0;

  if (currentCount > 15) {
    return true;
  }

  requestCountCache.set(countKey, currentCount + 1);

  if (lastRequest && now - lastRequest < 300) {
    // 300ms cooldown - allow faster toggling
    return true;
  }

  likeRequestCache.set(key, now);

  // Clean up old cache entries to prevent memory leaks
  if (likeRequestCache.size > 1000) {
    // Remove entries older than 5 minutes
    const cutoff = now - 300000;
    for (const [cacheKey, timestamp] of likeRequestCache.entries()) {
      if (timestamp < cutoff) {
        likeRequestCache.delete(cacheKey);
      }
    }
  }

  // Clean up request count cache
  if (requestCountCache.size > 1000) {
    const currentMinute = Math.floor(now / 60000);
    for (const [cacheKey] of requestCountCache.entries()) {
      const keyMinute = parseInt(cacheKey.split("-").pop() || "0");
      if (currentMinute - keyMinute > 2) {
        requestCountCache.delete(cacheKey);
      }
    }
  }

  return false;
};

export const createComment = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    user: { userId },
    params: { id: postId },
    body: { content },
  } = req;

  try {
    const post: PostType = await Post.findById(postId).populate("postedBy");

    if (!post) {
      throw new NotFound("The post you're trying to comment on does not exist");
    }

    if (post.status !== "published") {
      throw new BadRequest("Comments are disabled for unpublished posts");
    }

    const cleanContent = sanitizeContent(content);

    const comment = await Comment.create({
      ...req.body,
      content: cleanContent,
      postedBy: userId,
      post: postId,
    });
    const result = await Post.updateOne(
      { _id: postId },
      {
        $addToSet: { comments: comment._id },
      },
      { new: true }
    );
    if (result?.modifiedCount === 1) {
      const notificationService: NotificationService = req.app.get(
        "notificationService"
      );

      if (notificationService) {
        const populatedComment = await Comment.findById(comment._id)
          .populate("postedBy")
          .populate("likesCount");

        if (!populatedComment) {
          throw new NotFound("Failed to populate the new comment");
        }

        await notificationService.emitNewComment(
          postId,
          populatedComment,
          post.slug
        );

        const postOwnerId = (post.postedBy as any)?._id
          ? (post.postedBy as any)._id.toString()
          : post.postedBy.toString();

        if (postOwnerId !== userId) {
          await notificationService.createCommentNotification(
            postOwnerId,
            userId,
            postId,
            comment._id.toString()
          );
        }
      }

      const mentionRegex = /@(\w+)/g;
      const mentions = cleanContent.match(mentionRegex);

      if (mentions && notificationService) {
        const uniqueMentions = [
          ...new Set(mentions.map((mention) => mention.substring(1))),
        ];

        for (const username of uniqueMentions) {
          const mentionedUser = await User.findOne({ username });
          if (mentionedUser && mentionedUser._id.toString() !== userId) {
            await notificationService.createMentionNotification(
              mentionedUser._id,
              userId,
              postId,
              comment._id.toString()
            );
          }
        }
      }

      // Record user activity for comment creation
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      AnalyticsService.recordUserActivity({
        userId,
        action: "comment",
        resourceType: "post",
        resourceId: postId,
        metadata: {
          commentId: comment._id.toString(),
        },
        ipAddress,
        userAgent,
      }).catch((error) => {
        console.error("Error recording comment activity:", error);
      });

      const commentWithAnalytics = await Comment.findById(comment._id)
        .populate("likesCount")
        .populate("postedBy", "username avatar");

      if (!commentWithAnalytics) {
        throw new BadRequest("Failed to create comment with analytics");
      }

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          ...commentWithAnalytics.toJSON(),
          isLiked: false,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getComments = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    params: { postId },
  } = req;

  try {
    const post: PostType = await Post.findById(postId);

    if (!post) {
      throw new NotFound("This post doesn't exist");
    }

    if (!post?.comments?.length) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: [],
        message: "No comments on this post",
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate("likesCount")
      .populate("postedBy", "username avatar")
      .populate({
        path: "replies",
        // Limit replies to prevent performance issues
        options: { limit: 50 },
        populate: [
          {
            path: "postedBy",
            select: "username avatar",
          },
          {
            path: "likesCount",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(100);

    let commentsWithInteractions = comments.map((comment) =>
      (comment as any).toJSON()
    );

    if (req.userId) {
      const allCommentIds = commentsWithInteractions.map(
        (comment) => comment._id
      );
      const allReplyIds = commentsWithInteractions.flatMap((comment) =>
        comment.replies ? comment.replies.map((reply: any) => reply._id) : []
      );

      const allIds = [...allCommentIds, ...allReplyIds];

      // Batch fetch all like statuses to avoid N+1 query problem
      const likeStatuses = await AnalyticsService.getUserLikeStatusForComments(
        allIds,
        req.userId
      );

      // Map the results back to comments and replies
      commentsWithInteractions = commentsWithInteractions.map((comment) => {
        const isLiked = likeStatuses[comment._id] || false;

        let repliesWithLikes = comment.replies;
        if (comment.replies && comment.replies.length > 0) {
          repliesWithLikes = comment.replies.map((reply: any) => ({
            ...reply,
            isLiked: likeStatuses[reply._id] || false,
          }));
        }

        return {
          ...comment,
          isLiked,
          replies: repliesWithLikes,
        };
      });
    } else {
      // Ensure isLiked is always present for consistency with frontend
      commentsWithInteractions = commentsWithInteractions.map((comment) => ({
        ...comment,
        isLiked: false,
        replies:
          comment.replies?.map((reply: any) => ({
            ...reply,
            isLiked: false,
          })) || [],
      }));
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: commentsWithInteractions,
      count: commentsWithInteractions.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCommentById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    params: { id: commentId },
  } = req;

  try {
    if (!commentId) {
      throw new BadRequest("Comment ID is required");
    }

    const commentWithInteractions =
      await AnalyticsService.getUpdatedCommentWithLikes(commentId, req.userId);

    if (!commentWithInteractions) {
      throw new NotFound("No comments found");
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, data: commentWithInteractions });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    params: { id: postId, commentId },
    user: { userId },
  } = req;

  try {
    const post = (await Post.findById(postId)) as PostMongooseType | null;
    if (!post) {
      throw new NotFound("This post doesn't exist");
    }

    const comment: CommentType = await Comment.findOne({
      _id: commentId,
      postedBy: userId,
    });

    if (!comment) {
      throw new NotFound("No comments found");
    }

    if (!post?._id.equals(comment?.post)) {
      throw new BadRequest("Something went wrong");
    }

    // Recursively collect all nested reply IDs to delete
    const collectNestedReplyIds = async (
      commentId: string
    ): Promise<string[]> => {
      const currentComment = await Comment.findById(commentId);
      if (!currentComment || !currentComment.replies) return [];

      const nestedReplies: string[] = [];
      for (const replyId of currentComment.replies) {
        nestedReplies.push(replyId.toString());
        const childReplies = await collectNestedReplyIds(replyId.toString());
        nestedReplies.push(...childReplies);
      }

      return nestedReplies;
    };

    const allNestedReplyIds = await collectNestedReplyIds(commentId);

    // Remove comment from the post's comments array
    const result = await Post.updateOne(
      { _id: post._id },
      { $pull: { comments: commentId } },
      { new: true }
    );
    if (result.modifiedCount === 1) {
      await Comment.deleteOne({
        _id: commentId,
        postedBy: userId,
      });

      if (allNestedReplyIds.length > 0) {
        await Comment.deleteMany({
          _id: { $in: [...allNestedReplyIds, commentId] },
        });
      }

      // Emit socket event for real-time updates
      const notificationService: NotificationService = req.app.get(
        "notificationService"
      );

      if (notificationService) {
        await notificationService.emitCommentDeleted(
          commentId,
          postId,
          userId,
          [...allNestedReplyIds, commentId]
        );
      }

      res
        .status(StatusCodes.OK)
        .json({ success: true, msg: "Comment has been successfully deleted." });
    } else {
      throw new BadRequest("Something went wrong, please try again!");
    }
  } catch (error) {
    next(error);
  }
};

export const toggleLike = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    body: { commentId },
    params: { id: postId, replyId },
    user: { userId },
  } = req;

  try {
    const requestId = uuidv4();
    const targetCommentId = replyId || commentId;

    if (!targetCommentId) {
      throw new BadRequest("Comment ID or Reply ID is required");
    }

    const post = (await Post.findById(postId)) as PostMongooseType | null;
    const comment: CommentType = await Comment.findById({
      _id: targetCommentId,
    }).populate("postedBy");

    if (!comment) {
      throw new NotFound("No comments found");
    }

    // For replies, check if the reply belongs to the correct post
    if (replyId) {
      if (!post?._id.equals(comment?.post)) {
        throw new BadRequest("This reply does not belong to this post");
      }
    } else {
      if (!post?._id.equals(comment?.post)) {
        throw new BadRequest("This comment does not belong to this post");
      }
    }

    if (isDuplicateLikeRequest(userId, targetCommentId)) {
      const currentComment = await AnalyticsService.getUpdatedCommentWithLikes(
        targetCommentId,
        userId
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        msg: "Request already processed",
        data: {
          action: "duplicate",
          liked: currentComment?.isLiked || false,
          commentId: targetCommentId,
          userId,
          isReply: !!replyId,
          isDuplicate: true,
          requestId,
          updatedComment: currentComment,
          timestamp: Date.now(),
        },
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    const result = await AnalyticsService.toggleCommentLike(
      targetCommentId,
      userId,
      ipAddress,
      userAgent
    );

    const notificationService: NotificationService = req.app.get(
      "notificationService"
    );

    if (notificationService) {
      let parentCommentId;

      if (replyId) {
        const replyComment = await Comment.findById(replyId);
        parentCommentId = replyComment?.parentId?.toString();
      }

      await notificationService.emitCommentLikeUpdate(
        targetCommentId,
        userId,
        result.liked,
        !!replyId,
        parentCommentId
      );

      const commentOwnerId = (comment.postedBy as any)?._id
        ? (comment.postedBy as any)._id.toString()
        : comment.postedBy.toString();

      if (commentOwnerId !== userId && result.liked) {
        await notificationService.createCommentLikeNotification(
          commentOwnerId,
          userId,
          postId,
          targetCommentId
        );
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      msg: result.liked
        ? `You've liked this ${replyId ? "reply" : "comment"}.`
        : `You've disliked this ${replyId ? "reply" : "comment"}.`,
      data: {
        action: result.action,
        liked: result.liked,
        commentId: targetCommentId,
        userId,
        isReply: !!replyId,
        parentCommentId: replyId ? comment.parentId?.toString() : undefined,
        updatedComment: await AnalyticsService.getUpdatedCommentWithLikes(
          targetCommentId,
          userId
        ),
        // Add unique identifiers to help frontend avoid duplicate processing
        timestamp: Date.now(),
        requestId,
        responseId: `${targetCommentId}-${userId}-${Date.now()}`,
        // Add metadata to help frontend debug
        metadata: {
          isReply: !!replyId,
          parentId: replyId ? comment.parentId?.toString() : null,
          likeCount: comment.likesCount || 0,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCommentById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const {
    params: { id: postId, commentId },
    user: { userId },
    body: { content },
  } = req;

  try {
    const post = (await Post.findById(postId)) as PostMongooseType | null;
    if (!post) {
      throw new NotFound("This post doesn't exist");
    }

    const comment: CommentType = await Comment.findOne({
      _id: commentId,
      postedBy: userId,
    });

    if (!comment) {
      throw new NotFound(
        "No comments found or you're not authorized to edit this comment"
      );
    }

    if (!post?._id.equals(comment?.post)) {
      throw new BadRequest("This comment does not belong to this post");
    }

    if (!content || content.trim() === "") {
      throw new BadRequest("Comment content cannot be empty");
    }

    const cleanContent = sanitizeContent(content);

    const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId, postedBy: userId },
      { content: cleanContent },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      throw new BadRequest("Failed to update comment");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedComment,
      msg: "Comment updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
