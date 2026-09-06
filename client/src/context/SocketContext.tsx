"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { SocketContextType } from "@/typings/interfaces";
import { useQueryClient } from "@tanstack/react-query";
import { PostFetchType, UserFetchType } from "@/typings/types";
import { PostInterface } from "@/typings/interfaces";
import { useToast } from "@/components/ui/use-toast";
import { useSessionUserId } from "@/hooks/useSessionUserId";
import { useSession } from "next-auth/react";

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});
SocketContext.displayName = "SocketContext";

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { userId: currentUserId, isLoading: isAuthLoading } =
    useSessionUserId();
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return "🏷️";
      case "comment":
        return "💬";
      case "reply":
        return "↩️";
      case "bookmark":
        return "🔖";
      case "like":
        return "❤️";
      case "follow":
        return "🤝";
      default:
        return "🔔";
    }
  };
  const updatePostInCache = (
    postId: string,
    updateFn: (post: PostInterface) => PostInterface
  ) => {
    let hasUpdated = false;

    queryClient.setQueryData<PostFetchType>(["posts"], (oldData) => {
      if (!oldData?.data || !Array.isArray(oldData.data)) {
        return oldData;
      }
      const updatedData = {
        ...oldData,
        data: oldData.data.map((post: PostInterface) => {
          if (post._id?.toString() === postId) {
            const updatedPost = updateFn(post);
            hasUpdated = true;
            return updatedPost;
          }
          return post;
        }),
      };
      return updatedData;
    });

    // Also update individual post cache if it exists. We need to check all possible single post cache keys
    const queries = queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey.length === 2 &&
          queryKey[0] === "post" &&
          typeof queryKey[1] === "string"
        );
      },
    });

    queries.forEach((query) => {
      const [, slug] = query.queryKey as [string, string];
      queryClient.setQueryData(["post", slug], (oldData: any) => {
        if (!oldData?.data || oldData.data._id?.toString() !== postId) {
          return oldData;
        }
        const updatedPost = updateFn(oldData.data);
        hasUpdated = true;
        return {
          ...oldData,
          data: updatedPost,
        };
      });
    });
    if (!hasUpdated) {
      // Invalidate queries to refetch if cache update failed
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    }
  };

  const updateCommentInCache = (
    commentId: string,
    updateFn: (comment: any) => any
  ) => {
    let hasUpdated = false;

    queryClient.setQueryData(["comments"], (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) {
        return oldData;
      }
      const updatedData = oldData.map((comment: any) => {
        if (comment._id?.toString() === commentId) {
          const updatedComment = updateFn(comment);
          hasUpdated = true;
          return updatedComment;
        }
        return comment;
      });
      return updatedData;
    });

    const postCommentQueries = queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey.length >= 2 &&
          queryKey[0] === "comments" &&
          typeof queryKey[1] === "string"
        );
      },
    });

    postCommentQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData;
        }
        return oldData.map((comment: any) => {
          if (comment._id?.toString() === commentId) {
            const updatedComment = updateFn(comment);
            hasUpdated = true;
            return updatedComment;
          }
          return comment;
        });
      });
    });

    const replyQueries = queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey.length >= 2 &&
          (queryKey[0] === "replies" ||
            (typeof queryKey[0] === "string" &&
              queryKey[0].startsWith("replies-")))
        );
      },
    });

    replyQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData;
        }
        return oldData.map((reply: any) => {
          if (reply._id?.toString() === commentId) {
            const updatedReply = updateFn(reply);
            hasUpdated = true;
            return updatedReply;
          }
          return reply;
        });
      });
    });

    queryClient.setQueryData(["replies"], (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) {
        return oldData;
      }
      return oldData.map((reply: any) => {
        if (reply._id?.toString() === commentId) {
          const updatedReply = updateFn(reply);
          hasUpdated = true;
          return updatedReply;
        }
        return reply;
      });
    });

    if (!hasUpdated) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "comments" ||
              queryKey[0] === "replies" ||
              (typeof queryKey[0] === "string" &&
                queryKey[0].startsWith("replies-")))
          );
        },
      });
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const userId = currentUserId;
    if (!userId) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT?.replace("/api/v1", "") ||
      "http://localhost:8000";

    const newSocket = io(apiUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      withCredentials: true,
      auth: {
        token: (session?.user as any)?.accessToken,
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      // Join user-specific room for receiving notifications
      newSocket.emit("join", userId);
    });

    newSocket.on("joinConfirmation", (data) => {});

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
    });

    newSocket.on("postLikeUpdate", (data) => {
      // Update cache for ALL users to ensure real-time updates
      updatePostInCache(data.postId, (post) => {
        if (post.postedBy === userId && data.userId !== userId) {
          toast({
            title: `${getNotificationIcon("like")} Post Liked`,
            description: `Someone liked your post: "${post.title}"`,
            duration: 3000,
          });
        }
        const likes = post.likes || [];
        const currentLikesCount = post.likesCount || 0;

        if (data.isLiked) {
          if (!likes.includes(data.userId)) {
            return {
              ...post,
              likes: [...likes, data.userId],
              likesCount: currentLikesCount + 1,
              isLiked: data.userId === userId ? true : post.isLiked,
            };
          }
        } else {
          return {
            ...post,
            likes: likes.filter((id) => id !== data.userId),
            likesCount: Math.max(0, currentLikesCount - 1),
            isLiked: data.userId === userId ? false : post.isLiked,
          };
        }
        return post;
      });
    });
    newSocket.on("postBookmarkUpdate", (data) => {
      // Update cache for ALL users to ensure real-time updates
      updatePostInCache(data.postId, (post) => {
        if (post.postedBy === userId && data.userId !== userId) {
          toast({
            title: `${getNotificationIcon("bookmark")} Post Bookmarked`,
            description: `Someone bookmarked your post: "${post.title}"`,
            duration: 3000,
          });
        }
        const bookmarks = post.bookmarks || [];
        const currentBookmarksCount = post.bookmarksCount || 0;

        if (data.isBookmarked) {
          if (!bookmarks.includes(data.userId)) {
            return {
              ...post,
              bookmarks: [...bookmarks, data.userId],
              bookmarksCount: currentBookmarksCount + 1,
              isBookmarked: data.userId === userId ? true : post.isBookmarked,
            };
          }
        } else {
          return {
            ...post,
            bookmarks: bookmarks.filter((id) => id !== data.userId),
            bookmarksCount: Math.max(0, currentBookmarksCount - 1),
            isBookmarked: data.userId === userId ? false : post.isBookmarked,
          };
        }
        return post;
      });
    });
    newSocket.on("postCommentUpdate", (data) => {
      updatePostInCache(data.postId, (post) => {
        if (
          data.action === "add" &&
          data.userId !== userId &&
          post.postedBy === userId
        ) {
          toast({
            title: `${getNotificationIcon("comment")} New Comment`,
            description: `Someone commented on your post: "${post.title}"`,
            duration: 3000,
          });
        }
        const comments = post.comments || [];
        if (data.action === "add") {
          if (!comments.includes(data.commentId)) {
            return { ...post, comments: [...comments, data.commentId] };
          }
        } else if (data.action === "remove") {
          return {
            ...post,
            comments: comments.filter((id) => id !== data.commentId),
          };
        }
        return post;
      });
    });
    newSocket.on("notification", (notification) => {});

    newSocket.on("commentLikeUpdate", (data) => {
      // Update cache for ALL users to ensure real-time updates
      updateCommentInCache(data.commentId, (comment) => {
        // Show toast notification if someone liked the current user's comment
        if (
          (comment.postedBy === currentUserId ||
            comment.postedBy?._id === currentUserId ||
            comment.postedBy?.toString() === currentUserId) &&
          data.isLiked &&
          data.userId !== currentUserId
        ) {
          toast({
            title: `${getNotificationIcon("like")} Comment Liked`,
            description: "Someone liked your comment",
            duration: 3000,
          });
        }

        const likes = comment.likes || [];
        const currentLikesCount = comment.likesCount || 0;

        if (data.isLiked) {
          // User liked the comment
          if (!likes.includes(data.userId)) {
            return {
              ...comment,
              likes: [...likes, data.userId],
              likesCount: currentLikesCount + 1,
              isLiked: data.userId === currentUserId ? true : comment.isLiked,
            };
          } else {
            // User already liked it, just update isLiked if it's the current user
            return {
              ...comment,
              isLiked: data.userId === currentUserId ? true : comment.isLiked,
            };
          }
        } else {
          // User unliked the comment
          return {
            ...comment,
            likes: likes.filter((id: string) => id !== data.userId),
            likesCount: Math.max(0, currentLikesCount - 1),
            isLiked: data.userId === currentUserId ? false : comment.isLiked,
          };
        }
      });
    });

    newSocket.on("newComment", (data) => {
      const currentUserIdLocal = currentUserId;
      const commentAuthorId =
        data.comment.postedBy?._id || data.comment.postedBy;
      const isCurrentUserAuthor = currentUserIdLocal === commentAuthorId;

      // For OTHER users (not the comment author), add the new comment to the cache. The author's cache will be updated by the mutation's onSuccess to avoid conflicts
      if (!isCurrentUserAuthor) {
        queryClient.setQueryData<any>(["comments"], (oldData: any) => {
          if (!oldData) return [data.comment];

          const exists = oldData.find((c: any) => c._id === data.comment._id);
          if (exists) {
            return oldData;
          }

          return [...oldData, data.comment];
        });
      }

      // Show toast notification for post author if it's their post and they didn't create the comment
      if (!isCurrentUserAuthor) {
        let postOwnerId = null;

        const singlePostData = queryClient.getQueryData<any>([
          "post",
          data.postSlug,
        ]);
        if (singlePostData?.data?.postedBy) {
          postOwnerId = singlePostData.data.postedBy;
        }

        // If not found, try from posts list cache
        if (!postOwnerId) {
          const postsData = queryClient.getQueryData<any>(["posts"]);
          const postInList = postsData?.data?.find(
            (p: any) => p._id === data.postId
          );
          if (postInList?.postedBy) {
            postOwnerId = postInList.postedBy;
          }
        }

        if (
          postOwnerId &&
          (postOwnerId === currentUserIdLocal ||
            postOwnerId.toString() === currentUserIdLocal)
        ) {
          toast({
            title: `${getNotificationIcon("comment")} New Comment`,
            description: `Someone commented on your post`,
            duration: 3000,
          });
        }
      }
    });

    newSocket.on("newReply", (data) => {
      const currentUserIdLocal = currentUserId;
      const replyAuthorId = data.reply.postedBy?._id || data.reply.postedBy;
      const isCurrentUserAuthor = currentUserIdLocal === replyAuthorId;

      // For OTHER users (not the reply author), add the new reply to the cache. The author's cache will be updated by the mutation's onSuccess to avoid conflicts
      if (!isCurrentUserAuthor) {
        // Find and update the correct query key with IDs array
        const queriesForParent = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length === 2 &&
              queryKey[0] === `replies-${data.parentCommentId}` &&
              Array.isArray(queryKey[1])
            );
          },
        });

        queriesForParent.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData: any) => {
            if (!oldData) return [data.reply];

            const exists = oldData.find((r: any) => r._id === data.reply._id);
            if (exists) {
              return oldData;
            }

            return [...oldData, data.reply];
          });
        });

        queryClient.setQueryData(["replies"], (oldReplies: any) => {
          if (!oldReplies) return [data.reply];

          const exists = oldReplies.find((r: any) => r._id === data.reply._id);
          if (exists) {
            return oldReplies;
          }

          return [...oldReplies, data.reply];
        });

        // Update the parent comment's replies array in the comments cache
        queryClient.setQueryData(["comments"], (oldComments: any) => {
          if (!oldComments) return oldComments;

          return oldComments.map((comment: any) => {
            if (comment._id === data.parentCommentId) {
              const currentReplies = comment.replies || [];
              if (!currentReplies.includes(data.reply._id)) {
                return {
                  ...comment,
                  replies: [...currentReplies, data.reply._id],
                };
              }
            }
            return comment;
          });
        });

        // If this is a nested reply, also update the grandparent's replies cache
        if (data.reply.parentType === "reply") {
          // Find and update grandparent queries
          const grandparentQueries = queryClient.getQueryCache().findAll({
            predicate: (query) => {
              const queryKey = query.queryKey;
              return (
                Array.isArray(queryKey) &&
                queryKey.length === 2 &&
                queryKey[0] ===
                  `replies-${
                    data.reply.grandparentId || data.parentCommentId
                  }` &&
                Array.isArray(queryKey[1])
              );
            },
          });

          grandparentQueries.forEach((query) => {
            queryClient.setQueryData(query.queryKey, (oldReplies: any) => {
              if (!oldReplies) return oldReplies;

              return oldReplies.map((reply: any) => {
                if (reply._id === data.parentCommentId) {
                  const currentReplies = reply.replies || [];
                  if (!currentReplies.includes(data.reply._id)) {
                    return {
                      ...reply,
                      replies: [...currentReplies, data.reply._id],
                    };
                  }
                }
                return reply;
              });
            });
          });
        }
      }

      // Show toast notification for reply recipient if they didn't create the reply
      if (!isCurrentUserAuthor) {
        // Check if current user is the parent comment/reply author
        const comments = queryClient.getQueryData<any>(["comments"]);
        const parentComment = comments?.find(
          (c: any) =>
            c._id === data.parentCommentId &&
            (c.postedBy === currentUserIdLocal ||
              c.postedBy?._id === currentUserIdLocal ||
              c.postedBy?.toString() === currentUserIdLocal?.toString())
        );

        if (parentComment) {
          toast({
            title: `${getNotificationIcon("reply")} New Reply`,
            description: `Someone replied to your comment`,
            duration: 3000,
          });
        }
      }
    });
    newSocket.on("commentDeleted", (data) => {
      const currentUserIdLocal = currentUserId;

      if (data.userId !== currentUserIdLocal) {
        queryClient.setQueryData(["comments"], (oldComments: any) => {
          if (!oldComments || !Array.isArray(oldComments)) {
            return oldComments;
          }
          return oldComments.filter(
            (comment: any) =>
              !data.allDeletedIds.includes(comment._id?.toString())
          );
        });

        data.allDeletedIds.forEach((deletedId: string) => {
          queryClient.removeQueries({
            queryKey: [`replies-${deletedId}`],
          });
        });

        queryClient.setQueryData(["replies"], (oldReplies: any) => {
          if (!oldReplies || !Array.isArray(oldReplies)) {
            return oldReplies;
          }
          return oldReplies.filter(
            (reply: any) => !data.allDeletedIds.includes(reply._id?.toString())
          );
        });

        queryClient.setQueryData(["posts"], (oldPosts: any) => {
          if (!oldPosts?.data || !Array.isArray(oldPosts.data)) {
            return oldPosts;
          }
          return {
            ...oldPosts,
            data: oldPosts.data.map((post: any) => {
              if (post._id?.toString() === data.postId) {
                return {
                  ...post,
                  comments: (post.comments || []).filter(
                    (commentId: string) => commentId !== data.commentId
                  ),
                };
              }
              return post;
            }),
          };
        });

        // Update individual post cache
        const queries = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length === 2 &&
              queryKey[0] === "post" &&
              typeof queryKey[1] === "string"
            );
          },
        });

        queries.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData: any) => {
            if (
              !oldData?.data ||
              oldData.data._id?.toString() !== data.postId
            ) {
              return oldData;
            }
            return {
              ...oldData,
              data: {
                ...oldData.data,
                comments: (oldData.data.comments || []).filter(
                  (commentId: string) => commentId !== data.commentId
                ),
              },
            };
          });
        });
      }
    });

    newSocket.on("replyDeleted", (data) => {
      // Update cache for ALL users including the one who deleted

      // Remove the reply from its parent's replies cache
      // Find all query keys that match the pattern ["replies-${parentId}", ids]
      const parentReplyCaches = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            queryKey.length === 2 &&
            queryKey[0] === `replies-${data.parentId}` &&
            Array.isArray(queryKey[1])
          );
        },
      });

      parentReplyCaches.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldReplies: any) => {
          if (!oldReplies || !Array.isArray(oldReplies)) {
            return oldReplies;
          }
          const filtered = oldReplies.filter(
            (reply: any) => !data.allDeletedIds.includes(reply._id?.toString())
          );

          return filtered;
        });
      });

      queryClient.setQueryData(["comments"], (oldComments: any) => {
        if (!oldComments || !Array.isArray(oldComments)) {
          return oldComments;
        }
        return oldComments.map((comment: any) => {
          if (comment._id?.toString() === data.parentId) {
            return {
              ...comment,
              replies: (comment.replies || []).filter(
                (replyId: string) => !data.allDeletedIds.includes(replyId)
              ),
            };
          }
          return comment;
        });
      });

      // Update grandparent replies cache if the parent is also a reply
      const parentComment = queryClient
        .getQueryData<any>(["comments"])
        ?.find((c: any) => c._id?.toString() === data.parentId);

      if (parentComment?.parentId) {
        const grandparentReplyCaches = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length === 2 &&
              queryKey[0] === `replies-${parentComment.parentId}` &&
              Array.isArray(queryKey[1])
            );
          },
        });

        grandparentReplyCaches.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldReplies: any) => {
            if (!oldReplies || !Array.isArray(oldReplies)) {
              return oldReplies;
            }
            return oldReplies.map((reply: any) => {
              if (reply._id?.toString() === data.parentId) {
                return {
                  ...reply,
                  replies: (reply.replies || []).filter(
                    (replyId: string) => !data.allDeletedIds.includes(replyId)
                  ),
                };
              }
              return reply;
            });
          });
        });
      }

      // Remove replies caches for all deleted items
      data.allDeletedIds.forEach((deletedId: string) => {
        const deletedReplyCaches = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length === 2 &&
              queryKey[0] === `replies-${deletedId}` &&
              Array.isArray(queryKey[1])
            );
          },
        });

        deletedReplyCaches.forEach((query) => {
          queryClient.removeQueries({ queryKey: query.queryKey });
        });
      });

      queryClient.setQueryData(["replies"], (oldReplies: any) => {
        if (!oldReplies || !Array.isArray(oldReplies)) {
          return oldReplies;
        }
        return oldReplies.filter(
          (reply: any) => !data.allDeletedIds.includes(reply._id?.toString())
        );
      });
    });

    newSocket.on("followUpdate", (data) => {
      // Update cache for ALL users to ensure real-time updates
      const { followedUserId, followingUserId, isFollowing } = data;
      console.log("🔄 Follow update received:", {
        followedUserId,
        followingUserId,
        isFollowing,
        currentUserId,
        isCurrentUserFollowing: followingUserId === currentUserId,
        isCurrentUserFollowed: followedUserId === currentUserId,
      });

      // Emit a custom event to notify useFollowUser hook that socket event was received
      if (followingUserId === currentUserId) {
        window.dispatchEvent(
          new CustomEvent("followUpdateReceived", {
            detail: { followedUserId, isFollowing },
          })
        );
      }

      // Update the current user's following list if they are the one following/unfollowing
      queryClient.setQueryData<UserFetchType>(
        ["currentUser"],
        (oldData: UserFetchType | undefined) => {
          if (
            !oldData?.data ||
            oldData.data._id?.toString() !== followingUserId
          ) {
            return oldData;
          }
          const following = oldData.data.following || [];
          const alreadyFollowing = following.some(
            (id) => id.toString() === followedUserId.toString()
          );

          const newFollowing = isFollowing
            ? alreadyFollowing
              ? following
              : [...following, followedUserId]
            : following.filter(
                (id: string) => id.toString() !== followedUserId.toString()
              );

          return {
            ...oldData,
            data: {
              ...oldData.data,
              following: newFollowing,
            },
          };
        }
      );

      // Update all user profile queries (user-*) and post author data
      const userQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "user-" ||
              (queryKey[0] === "post" && queryKey.length === 2) ||
              queryKey[0] === "posts")
          );
        },
      });

      userQueries.forEach((query) => {
        const queryKey = query.queryKey;
        // Update direct user queries (e.g., user profile)
        if (
          typeof queryKey[0] === "string" &&
          queryKey[0].startsWith("user-")
        ) {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (
              !oldData?.data ||
              oldData.data._id?.toString() !== followedUserId
            ) {
              return oldData;
            }

            const followers = oldData.data.followers || [];
            const alreadyFollower = followers.some(
              (id: string) => id.toString() === followingUserId.toString()
            );

            const newFollowers = isFollowing
              ? alreadyFollower
                ? followers
                : [...followers, followingUserId]
              : followers.filter(
                  (id: string) => id.toString() !== followingUserId.toString()
                );

            return {
              ...oldData,
              data: {
                ...oldData.data,
                followers: newFollowers,
                isFollowed: isFollowing,
              },
            };
          });
        }

        // Update post author data
        if (queryKey[0] === "post" || queryKey[0] === "posts") {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData?.data) return oldData;

            const updatePostData = (post: any) => {
              if (!post?.postedBy || !post?.postedBy?._id) {
                return post;
              }

              const postedById = post.postedBy._id?.toString
                ? post.postedBy._id.toString()
                : String(post.postedBy._id);

              if (postedById === followedUserId) {
                const followers = Array.isArray(post.postedBy.followers)
                  ? post.postedBy.followers
                  : [];

                const alreadyFollower = followers.some((id: string) => {
                  const followerId = id?.toString ? id.toString() : String(id);
                  const followingId = followingUserId?.toString
                    ? followingUserId.toString()
                    : String(followingUserId);
                  return followerId === followingId;
                });

                const newFollowers = isFollowing
                  ? alreadyFollower
                    ? followers
                    : [...followers, followingUserId]
                  : followers.filter((id: string) => {
                      const followerId = id?.toString
                        ? id.toString()
                        : String(id);
                      const followingId = followingUserId?.toString
                        ? followingUserId.toString()
                        : String(followingUserId);
                      return followerId !== followingId;
                    });

                return {
                  ...post,
                  postedBy: {
                    ...post.postedBy,
                    followers: newFollowers,
                    isFollowed: isFollowing,
                  },
                };
              }
              return post;
            };

            if (!Array.isArray(oldData.data)) {
              return {
                ...oldData,
                data: updatePostData(oldData.data),
              };
            }

            return {
              ...oldData,
              data: oldData.data.map((post: any) => updatePostData(post)),
            };
          });
        }
      });

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Find all user-* queries to invalidate them
      const allUserQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            typeof queryKey[0] === "string" &&
            queryKey[0].startsWith("user-")
          );
        },
      });

      allUserQueries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });

      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // Then scheduled refresh for components that might be slow to update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        allUserQueries.forEach((query) => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });
        queryClient.invalidateQueries({ queryKey: ["post"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }, 300);

      if (
        isFollowing &&
        followedUserId === currentUserId &&
        followingUserId !== currentUserId
      ) {
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUserId, isAuthLoading, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
    }),
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
