import { useToast } from "@/components/ui/use-toast";
import { PostType } from "@/typings/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { clearCache } from "@/utils/request-cache";

const useDeletePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async (variables: { post: PostType }) => {
      const res = await axios.delete(`/api/posts/${variables.post._id}`);
      return res.data.data;
    },
    onMutate: async (variables: { post: PostType }) => {
      // Clear from in-memory request-cache immediately so stale cache doesn't resurrect it
      clearCache("/api/posts");
      clearCache("/api/posts/my-posts");
      if (variables.post.slug) {
        clearCache(`/api/posts/${variables.post.slug}`);
        clearCache(`/api/posts/preview/${variables.post.slug}`);
      }
      if (variables.post._id) {
        clearCache(`/api/posts/${variables.post._id}`);
      }

      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["user-posts"] });

      const previousPosts = queryClient.getQueryData<any>(["posts"]);

      const targetId = variables.post._id?.toString() || variables.post._id;

      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter(
            (post: PostType) =>
              (post._id?.toString() || post._id) !== targetId
          );
        }
        if (Array.isArray(old?.data)) {
          const newData = old.data.filter(
            (post: PostType) =>
              (post._id?.toString() || post._id) !== targetId
          );
          return {
            ...old,
            data: newData,
            count: newData.length,
          };
        }
        return old;
      });

      return { previousPosts };
    },
    onSuccess: (data, variables) => {
      clearCache("/api/posts");
      clearCache("/api/posts/my-posts");
      if (variables.post.slug) {
        clearCache(`/api/posts/${variables.post.slug}`);
        clearCache(`/api/posts/preview/${variables.post.slug}`);
      }
      if (variables.post._id) {
        clearCache(`/api/posts/${variables.post._id}`);
      }

      const targetId = variables.post._id?.toString() || variables.post._id;

      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter(
            (post: PostType) =>
              (post._id?.toString() || post._id) !== targetId
          );
        }
        if (Array.isArray(old?.data)) {
          const newData = old.data.filter(
            (post: PostType) =>
              (post._id?.toString() || post._id) !== targetId
          );
          return {
            ...old,
            data: newData,
            count: newData.length,
          };
        }
        return old;
      });

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post",
      });
    },
    onSettled: (data, error, variables) => {
      clearCache("/api/posts");
      clearCache("/api/posts/my-posts");
      if (variables?.post?.slug) {
        queryClient.removeQueries({ queryKey: ["post", variables.post.slug] });
        queryClient.removeQueries({
          queryKey: ["preview-post", variables.post.slug],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });

  return {
    deletePost: (post: PostType) => deletePostMutation.mutate({ post }),
    status: deletePostMutation.status,
    error: deletePostMutation.error,
  };
};

export default useDeletePost;
