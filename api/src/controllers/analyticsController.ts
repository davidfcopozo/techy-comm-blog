import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AnalyticsService } from "../utils/analyticsService";
import { RequestWithUserInfo } from "../typings/models/user";

export const recordPostView = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const { viewDuration, source, referrer, sessionId } = req.body || {};
    const userId = req.userId || req.user?.userId;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress;
    const userAgent = req.get("User-Agent");
    const clientSessionId =
      sessionId || (req.headers["x-session-id"] as string);

    const postView = await AnalyticsService.recordPostView({
      postId,
      userId,
      ipAddress,
      userAgent,
      source,
      referrer,
      sessionId: clientSessionId,
      viewDuration,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: postView
        ? "Post view recorded successfully"
        : "View skipped or already recorded",
      data: postView,
    });
  } catch (error) {
    console.error("Error recording post view:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to record post view",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const togglePostLike = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await AnalyticsService.togglePostLike(
      postId,
      userId,
      ipAddress,
      userAgent
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Post ${result.action}d successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error toggling post like:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to toggle post like",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const togglePostBookmark = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await AnalyticsService.togglePostBookmark(
      postId,
      userId,
      ipAddress,
      userAgent
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Post ${result.action}ed successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error toggling post bookmark:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to toggle post bookmark",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const toggleCommentLike = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await AnalyticsService.toggleCommentLike(
      commentId,
      userId,
      ipAddress,
      userAgent
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Comment ${result.action}d successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to toggle comment like",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPostAnalytics = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await AnalyticsService.getPostAnalytics(
      postId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting post analytics:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get post analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPostShareAnalytics = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await AnalyticsService.getPostShareAnalytics(
      postId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get post share analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getCommentAnalytics = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await AnalyticsService.getCommentAnalytics(
      commentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting comment analytics:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get comment analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserAnalytics = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Ensure user can only access their own analytics or admin access
    if (req.user?.userId !== userId && req.user?.role !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    const analytics = await AnalyticsService.getUserAnalytics(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get user analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserPostInteractions = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const interactions = await AnalyticsService.getUserPostInteractions(
      postId,
      userId
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: interactions,
    });
  } catch (error) {
    console.error("Error getting user post interactions:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get user post interactions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserCommentInteractions = async (
  req: RequestWithUserInfo | any,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const interactions = await AnalyticsService.getUserCommentInteractions(
      commentId,
      userId
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: interactions,
    });
  } catch (error) {
    console.error("Error getting user comment interactions:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to get user comment interactions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
