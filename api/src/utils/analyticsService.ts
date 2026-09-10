import PostView from "../models/postViewModel";
import Post from "../models/postModel";
import PostLike from "../models/postLikeModel";
import PostBookmark from "../models/postBookmarkModel";
import PostShare from "../models/postShareModel";
import CommentLike from "../models/commentLikeModel";
import UserActivity from "../models/userActivityModel";
import Comment from "../models/commentModel";
import mongoose, { Types } from "mongoose";

export class AnalyticsService {
  // Helper method to check if a view is from a unique visitor
  static async shouldRecordUniqueView(
    postId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      // 1. Authenticated user: must only be counted once per post
      if (userId && Types.ObjectId.isValid(userId)) {
        const existingUserView = await PostView.findOne({
          post: new Types.ObjectId(postId),
          user: new Types.ObjectId(userId),
        }).select("_id");

        if (existingUserView) {
          return false;
        }
        return true;
      }

      // 2. Anonymous visitor: must have IP or session ID
      if (!ipAddress && !sessionId) {
        return false;
      }

      const anonymousConditions: any[] = [];
      if (sessionId) {
        anonymousConditions.push({ sessionId });
      }
      if (ipAddress) {
        if (userAgent) {
          anonymousConditions.push({ ipAddress, userAgent });
        } else {
          anonymousConditions.push({ ipAddress });
        }
      }

      const existingAnonView = await PostView.findOne({
        post: new Types.ObjectId(postId),
        user: { $exists: false },
        $or: anonymousConditions,
      }).select("_id");

      if (existingAnonView) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking unique view eligibility:", error);
      return false;
    }
  }

  // Post Views
  static async recordPostView(data: {
    postId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    source?: string;
    referrer?: string;
    sessionId?: string;
    viewDuration?: number;
    isEditing?: boolean;
    isPreview?: boolean;
    skipCount?: boolean;
  }) {
    try {
      if (!data.postId || !Types.ObjectId.isValid(data.postId)) {
        throw new Error("Invalid post ID provided");
      }

      // Skip under any editing, previewing, or metadata contexts
      if (data.isEditing || data.isPreview || data.skipCount) {
        return null;
      }

      if (data.userId && !Types.ObjectId.isValid(data.userId)) {
        data.userId = undefined;
      }

      // Verify post existence, status, and check author ownership
      const post = await Post.findById(data.postId).select(
        "_id postedBy status visits"
      );
      if (!post || post.status !== "published") {
        return null;
      }

      // STRICT RULE: Under no circumstances can a post owner add up a post view count
      const postAuthorId =
        (post.postedBy as any)?._id?.toString() || post.postedBy?.toString();

      if (
        data.userId &&
        postAuthorId &&
        data.userId.toString() === postAuthorId.toString()
      ) {
        return null;
      }

      // Sanitize viewDuration - Max 24 hours
      const viewDuration = Math.max(0, Math.min(data.viewDuration || 0, 86400));

      // Limit string lengths to prevent potential abuse
      const ipAddress = data.ipAddress?.substring(0, 45);
      const userAgent = data.userAgent?.substring(0, 500);
      const referrer = data.referrer?.substring(0, 2048);
      const sessionId = data.sessionId?.substring(0, 128);

      const validSources = ["direct", "search", "social", "referral", "email"];
      const source = validSources.includes(data.source || "")
        ? data.source
        : "direct";

      // STRICT RULE: Only record if this is a unique visitor
      const isUniqueVisitor = await this.shouldRecordUniqueView(
        data.postId,
        data.userId,
        ipAddress,
        userAgent,
        sessionId
      );

      if (!isUniqueVisitor) {
        return null;
      }

      const postView = new PostView({
        post: data.postId,
        user: data.userId ? new Types.ObjectId(data.userId) : undefined,
        ipAddress,
        userAgent,
        source,
        referrer,
        sessionId,
        viewDuration,
      });

      await postView.save();

      // Atomically increment post visits count for this unique visitor
      await Post.findByIdAndUpdate(data.postId, {
        $inc: { visits: 1 },
      });

      if (data.userId) {
        await this.recordUserActivity({
          userId: data.userId,
          action: "view",
          resourceType: "post",
          resourceId: data.postId,
          metadata: {
            source,
            viewDuration,
          },
          ipAddress,
          userAgent,
        });
      }

      return postView;
    } catch (error) {
      console.error("Error recording post view:", error);
      throw error;
    }
  }

  // Post Likes
  static async togglePostLike(
    postId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID provided");
      }

      const sanitizedIpAddress = ipAddress?.substring(0, 45);
      const sanitizedUserAgent = userAgent?.substring(0, 500);

      const existingLike = await PostLike.findOne({
        post: postId,
        user: userId,
      });

      let action: "like" | "unlike";

      if (existingLike) {
        existingLike.isActive = !existingLike.isActive;
        await existingLike.save();
        action = existingLike.isActive ? "like" : "unlike";
      } else {
        await PostLike.create({
          post: postId,
          user: userId,
          isActive: true,
        });
        action = "like";
      }

      await this.recordUserActivity({
        userId,
        action,
        resourceType: "post",
        resourceId: postId,
        ipAddress: sanitizedIpAddress,
        userAgent: sanitizedUserAgent,
      });

      return { action, liked: action === "like" };
    } catch (error) {
      console.error("Error toggling post like:", error);
      throw error;
    }
  }

  // Post Bookmarks
  static async togglePostBookmark(
    postId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID provided");
      }

      const sanitizedIpAddress = ipAddress?.substring(0, 45);
      const sanitizedUserAgent = userAgent?.substring(0, 500);

      const existingBookmark = await PostBookmark.findOne({
        post: postId,
        user: userId,
      });

      let action: "bookmark" | "unbookmark";

      if (existingBookmark) {
        existingBookmark.isActive = !existingBookmark.isActive;
        await existingBookmark.save();
        action = existingBookmark.isActive ? "bookmark" : "unbookmark";
      } else {
        await PostBookmark.create({
          post: postId,
          user: userId,
          isActive: true,
        });
        action = "bookmark";
      }

      await this.recordUserActivity({
        userId,
        action,
        resourceType: "post",
        resourceId: postId,
        ipAddress: sanitizedIpAddress,
        userAgent: sanitizedUserAgent,
      });

      return { action, bookmarked: action === "bookmark" };
    } catch (error) {
      console.error("Error toggling post bookmark:", error);
      throw error;
    }
  }

  static async recordPostShare(data: {
    postId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    shareType:
      | "native"
      | "facebook"
      | "x"
      | "linkedin"
      | "copy-link"
      | "whatsapp"
      | "email"
      | "other";
    referrer?: string;
  }) {
    try {
      if (!data.postId || !Types.ObjectId.isValid(data.postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (data.userId && !Types.ObjectId.isValid(data.userId)) {
        throw new Error("Invalid user ID provided");
      }

      const sanitizedIpAddress = data.ipAddress?.substring(0, 45);
      const sanitizedUserAgent = data.userAgent?.substring(0, 500);
      const sanitizedReferrer = data.referrer?.substring(0, 2000);

      const shareRecord = await PostShare.create({
        post: data.postId,
        user: data.userId || undefined,
        ipAddress: sanitizedIpAddress,
        userAgent: sanitizedUserAgent,
        shareType: data.shareType,
        referrer: sanitizedReferrer,
        isActive: true,
      });

      if (data.userId) {
        await this.recordUserActivity({
          userId: data.userId,
          action: "share",
          resourceType: "post",
          resourceId: data.postId,
          ipAddress: sanitizedIpAddress,
          userAgent: sanitizedUserAgent,
          metadata: {
            shareType: data.shareType,
            referrer: sanitizedReferrer,
          },
        });
      }

      return {
        shareId: shareRecord._id,
        shareType: data.shareType,
        timestamp: shareRecord.createdAt,
      };
    } catch (error) {
      console.error("Error recording post share:", error);
      throw error;
    }
  }

  // Comment Likes
  static async toggleCommentLike(
    commentId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const session = await mongoose.startSession();

    try {
      if (!commentId || !Types.ObjectId.isValid(commentId)) {
        throw new Error("Invalid comment ID provided");
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID provided");
      }
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      const sanitizedIpAddress = ipAddress?.substring(0, 45);
      const sanitizedUserAgent = userAgent?.substring(0, 500);

      let result;

      await session.withTransaction(async () => {
        const existingLike = await CommentLike.findOne({
          comment: commentId,
          user: userId,
        }).session(session);

        let action: "like" | "unlike";

        if (existingLike) {
          existingLike.isActive = !existingLike.isActive;
          await existingLike.save({ session });
          action = existingLike.isActive ? "like" : "unlike";
        } else {
          await CommentLike.create(
            [
              {
                comment: commentId,
                user: userId,
                isActive: true,
              },
            ],
            { session }
          );
          action = "like";
        }

        result = { action, liked: action === "like" };
      });

      // Record activity outside of transaction to prevent blocking
      setImmediate(() => {
        this.recordUserActivity({
          userId,
          action: result!.action,
          resourceType: "comment",
          resourceId: commentId,
          ipAddress: sanitizedIpAddress,
          userAgent: sanitizedUserAgent,
        }).catch((error) => {
          console.error("Error recording user activity:", error);
        });
      });

      return result!;
    } catch (error) {
      console.error("Error toggling comment like:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async recordUserActivity(data: {
    userId: string;
    action:
      | "view"
      | "like"
      | "unlike"
      | "bookmark"
      | "unbookmark"
      | "share"
      | "comment"
      | "reply"
      | "edit"
      | "delete";
    resourceType: "post" | "comment";
    resourceId: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const activity = new UserActivity({
        user: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error("Error recording user activity:", error);
      throw error;
    }
  }

  // Analytics Queries
  static async getPostAnalytics(
    postId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (startDate && endDate && startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      // Limit date range to prevent excessive queries (max 1 year)
      if (startDate && endDate) {
        // 1 year in milliseconds
        const maxRange = 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > maxRange) {
          throw new Error("Date range cannot exceed 1 year");
        }
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      const [views, likes, bookmarks, shares] = await Promise.all([
        PostView.countDocuments({
          post: postId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        }),

        PostLike.countDocuments({
          post: postId,
          isActive: true,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        }),

        PostBookmark.countDocuments({
          post: postId,
          isActive: true,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        }),

        PostShare.countDocuments({
          post: postId,
          isActive: true,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        }),
      ]);

      return { views, likes, bookmarks, shares };
    } catch (error) {
      console.error("Error getting post analytics:", error);
      throw error;
    }
  }

  static async getPostShareAnalytics(
    postId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (startDate && endDate && startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      const matchStage: any = {
        post: new Types.ObjectId(postId),
        isActive: true,
      };

      if (Object.keys(dateFilter).length > 0) {
        matchStage.createdAt = dateFilter;
      }

      const shareStats = await PostShare.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$shareType",
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: { $ifNull: ["$user", "$ipAddress"] } },
          },
        },
        {
          $project: {
            shareType: "$_id",
            count: 1,
            uniqueCount: { $size: "$uniqueUsers" },
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
      ]);

      const totalShares = await PostShare.countDocuments(matchStage);

      return {
        totalShares,
        sharesByType: shareStats,
      };
    } catch (error) {
      console.error("Error getting post share analytics:", error);
      throw error;
    }
  }

  static async getCommentAnalytics(
    commentId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      const likes = await CommentLike.countDocuments({
        comment: commentId,
        isActive: true,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      });

      return { likes };
    } catch (error) {
      console.error("Error getting comment analytics:", error);
      throw error;
    }
  }

  static async getUserAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;

      const activities = await UserActivity.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ]);

      const activityMap = activities.reduce((acc, activity) => {
        acc[activity._id] = activity.count;
        return acc;
      }, {});

      return activityMap;
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw error;
    }
  }

  // Check if user has liked/bookmarked
  static async getUserPostInteractions(postId: string, userId: string) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID provided");
      }

      const [like, bookmark] = await Promise.all([
        PostLike.findOne({ post: postId, user: userId, isActive: true }),
        PostBookmark.findOne({ post: postId, user: userId, isActive: true }),
      ]);

      return {
        liked: !!like,
        bookmarked: !!bookmark,
      };
    } catch (error) {
      console.error("Error getting user post interactions:", error);
      throw error;
    }
  }

  static async getUserCommentInteractions(commentId: string, userId: string) {
    try {
      if (!commentId || !Types.ObjectId.isValid(commentId)) {
        throw new Error("Invalid comment ID provided");
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID provided");
      }

      const like = await CommentLike.findOne({
        comment: commentId,
        user: userId,
        isActive: true,
      });

      return {
        liked: !!like,
      };
    } catch (error) {
      console.error("Error getting user comment interactions:", error);
      throw error;
    }
  }

  // Data maintenance methods
  static async cleanupOldViews(daysOld: number = 365) {
    try {
      if (daysOld < 30) {
        throw new Error("Cannot cleanup views newer than 30 days");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await PostView.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Error cleaning up old views:", error);
      throw error;
    }
  }

  static async cleanupOldUserActivity(daysOld: number = 365) {
    try {
      if (daysOld < 30) {
        throw new Error("Cannot cleanup activity newer than 30 days");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await UserActivity.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Error cleaning up old user activity:", error);
      throw error;
    }
  }

  // Aggregation methods for more speific analytics
  static async getTopPostsByViews(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      if (limit > 100) {
        throw new Error("Limit cannot exceed 100");
      }

      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const pipeline = [];

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      pipeline.push(
        {
          $group: {
            _id: "$post",
            viewCount: { $sum: 1 },
            uniqueUsers: { $addToSet: "$user" },
            uniqueIPs: { $addToSet: "$ipAddress" },
          },
        },
        {
          $addFields: {
            uniqueUserCount: { $size: "$uniqueUsers" },
            uniqueIPCount: { $size: "$uniqueIPs" },
          },
        },
        {
          $sort: { viewCount: -1 as const },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "_id",
            as: "post",
          },
        },
        {
          $unwind: "$post",
        }
      );

      const results = await PostView.aggregate(pipeline);
      return results;
    } catch (error) {
      console.error("Error getting top posts by views:", error);
      throw error;
    }
  }

  static async getDailyAnalytics(postId: string, days: number = 30) {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        throw new Error("Invalid post ID provided");
      }

      if (days > 365 || days < 1) {
        throw new Error("Days must be between 1 and 365");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            post: new Types.ObjectId(postId),
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            views: { $sum: 1 },
            uniqueUsers: { $addToSet: "$user" },
            sources: { $push: "$source" },
          },
        },
        {
          $addFields: {
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              },
            },
            uniqueUserCount: { $size: "$uniqueUsers" },
          },
        },
        {
          $sort: { date: 1 as const },
        },
      ];

      const dailyViews = await PostView.aggregate(pipeline);

      // Get daily likes and bookmarks
      const [dailyLikes, dailyBookmarks] = await Promise.all([
        PostLike.aggregate([
          {
            $match: {
              post: new Types.ObjectId(postId),
              isActive: true,
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
              },
              likes: { $sum: 1 },
            },
          },
          {
            $addFields: {
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
        ]),

        PostBookmark.aggregate([
          {
            $match: {
              post: new Types.ObjectId(postId),
              isActive: true,
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
              },
              bookmarks: { $sum: 1 },
            },
          },
          {
            $addFields: {
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
        ]),
      ]);

      return {
        views: dailyViews,
        likes: dailyLikes,
        bookmarks: dailyBookmarks,
      };
    } catch (error) {
      console.error("Error getting daily analytics:", error);
      throw error;
    }
  }

  static async hasUserLikedComment(
    commentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!commentId || !Types.ObjectId.isValid(commentId)) {
        return false;
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        return false;
      }

      const like = await CommentLike.findOne({
        comment: commentId,
        user: userId,
        isActive: true,
      });

      return !!like;
    } catch (error) {
      console.error("Error checking comment like status:", error);
      return false;
    }
  }

  static async hasUserLikedPost(
    postId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        return false;
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        return false;
      }

      const like = await PostLike.findOne({
        post: postId,
        user: userId,
        isActive: true,
      });

      return !!like;
    } catch (error) {
      console.error("Error checking post like status:", error);
      return false;
    }
  }

  static async hasUserBookmarkedPost(
    postId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!postId || !Types.ObjectId.isValid(postId)) {
        return false;
      }

      if (!userId || !Types.ObjectId.isValid(userId)) {
        return false;
      }

      const bookmark = await PostBookmark.findOne({
        post: postId,
        user: userId,
        isActive: true,
      });

      return !!bookmark;
    } catch (error) {
      console.error("Error checking post bookmark status:", error);
      return false;
    }
  }

  static async getUserLikeStatusForComments(
    commentIds: string[],
    userId: string
  ): Promise<Record<string, boolean>> {
    try {
      if (!commentIds.length || !userId || !Types.ObjectId.isValid(userId)) {
        return {};
      }

      const validCommentIds = commentIds.filter(
        (id) => id && Types.ObjectId.isValid(id)
      );

      if (!validCommentIds.length) {
        return {};
      }

      const likes = await CommentLike.find({
        comment: { $in: validCommentIds },
        user: userId,
        isActive: true,
      }).select("comment");

      // Create a map of commentId -> true for liked comments
      const likeMap: Record<string, boolean> = {};

      // Initialize all comments as not liked
      validCommentIds.forEach((id) => {
        likeMap[id] = false;
      });

      // Mark liked comments as true
      likes.forEach((like) => {
        likeMap[like.comment.toString()] = true;
      });

      return likeMap;
    } catch (error) {
      return {};
    }
  }

  static async getUpdatedCommentWithLikes(
    commentId: string,
    userId?: string
  ): Promise<any> {
    try {
      const comment = await Comment.findById(commentId)
        .populate("likesCount")
        .populate("postedBy", "username avatar");

      if (!comment) {
        return null;
      }

      const commentData = (comment as any).toJSON();

      if (userId) {
        const isLiked = await this.hasUserLikedComment(commentId, userId);
        return {
          ...commentData,
          isLiked,
        };
      }

      return {
        ...commentData,
        isLiked: false,
      };
    } catch (error) {
      return null;
    }
  }
}
