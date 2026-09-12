import { AnalyticsService } from "../../../src/utils/analyticsService";
import PostView from "../../../src/models/postViewModel";
import Post from "../../../src/models/postModel";
import { Types } from "mongoose";

describe("AnalyticsService - Post View Deduplication & Owner Exclusion", () => {
  const authorId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const postId = new Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("shouldRecordUniqueView", () => {
    it("should return false if authenticated user has already viewed the post", async () => {
      jest.spyOn(PostView, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      } as any);

      const result = await AnalyticsService.shouldRecordUniqueView(
        postId,
        otherUserId
      );

      expect(result).toBe(false);
      expect(PostView.findOne).toHaveBeenCalledWith({
        post: new Types.ObjectId(postId),
        user: new Types.ObjectId(otherUserId),
      });
    });

    it("should return true if authenticated user has not viewed the post yet", async () => {
      jest.spyOn(PostView, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await AnalyticsService.shouldRecordUniqueView(
        postId,
        otherUserId
      );

      expect(result).toBe(true);
    });

    it("should return false if anonymous visitor has already viewed with the same sessionId", async () => {
      jest.spyOn(PostView, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      } as any);

      const result = await AnalyticsService.shouldRecordUniqueView(
        postId,
        undefined,
        "192.168.1.1",
        "Mozilla/5.0",
        "session-123"
      );

      expect(result).toBe(false);
      expect(PostView.findOne).toHaveBeenCalledWith({
        post: new Types.ObjectId(postId),
        $or: [
          { sessionId: "session-123" },
          { ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0" },
        ],
      });
    });

    it("should return true if anonymous visitor is new", async () => {
      jest.spyOn(PostView, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await AnalyticsService.shouldRecordUniqueView(
        postId,
        undefined,
        "192.168.1.2",
        "Mozilla/5.0",
        "session-456"
      );

      expect(result).toBe(true);
    });

    it("should return false if anonymous visitor provides neither ipAddress nor sessionId", async () => {
      const result = await AnalyticsService.shouldRecordUniqueView(
        postId,
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(result).toBe(false);
    });
  });

  describe("recordPostView", () => {
    it("should return null immediately if user is the post author (owner exclusion)", async () => {
      jest.spyOn(Post, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(postId),
          postedBy: authorId,
          status: "published",
          visits: 10,
        }),
      } as any);

      const findByIdAndUpdateSpy = jest.spyOn(Post, "findByIdAndUpdate");

      const result = await AnalyticsService.recordPostView({
        postId,
        userId: authorId,
      });

      expect(result).toBeNull();
      expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
    });

    it("should return null if post is not published", async () => {
      jest.spyOn(Post, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(postId),
          postedBy: authorId,
          status: "draft",
          visits: 0,
        }),
      } as any);

      const result = await AnalyticsService.recordPostView({
        postId,
        userId: otherUserId,
      });

      expect(result).toBeNull();
    });

    it("should return null if visitor is not unique", async () => {
      jest.spyOn(Post, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(postId),
          postedBy: authorId,
          status: "published",
          visits: 5,
        }),
      } as any);

      jest
        .spyOn(AnalyticsService, "shouldRecordUniqueView")
        .mockResolvedValue(false);

      const findByIdAndUpdateSpy = jest.spyOn(Post, "findByIdAndUpdate");

      const result = await AnalyticsService.recordPostView({
        postId,
        userId: otherUserId,
      });

      expect(result).toBeNull();
      expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
    });

    it("should save view and atomically increment visits count when visitor is unique", async () => {
      jest.spyOn(Post, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(postId),
          postedBy: authorId,
          status: "published",
          visits: 5,
        }),
      } as any);

      jest
        .spyOn(AnalyticsService, "shouldRecordUniqueView")
        .mockResolvedValue(true);

      jest
        .spyOn(PostView.prototype, "save")
        .mockResolvedValue({ _id: new Types.ObjectId() } as any);

      const findByIdAndUpdateSpy = jest
        .spyOn(Post, "findByIdAndUpdate")
        .mockResolvedValue({} as any);

      jest.spyOn(AnalyticsService, "recordUserActivity").mockResolvedValue({} as any);

      const result = await AnalyticsService.recordPostView({
        postId,
        userId: otherUserId,
        sessionId: "sess-abc",
      });

      expect(result).toBeDefined();
      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(postId, {
        $inc: { visits: 1 },
      });
    });
  });
});
