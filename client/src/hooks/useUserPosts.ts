import useFetchRequest from "@/hooks/useFetchRequest";
import { PostType } from "@/typings/types";

const useUserPosts = (userId: string) => {
  const {
    data: posts,
    error: postsError,
    isFetching: arePostsFetching,
    isLoading: arePostsLoading,
  } = useFetchRequest(["user-posts"], userId ? "/api/posts/my-posts" : null, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const blogPosts = Array.isArray(posts?.data)
    ? [...posts.data].sort(
        (a: PostType, b: PostType) =>
          new Date(String(b.createdAt ?? new Date())).getTime() -
          new Date(String(a.createdAt ?? new Date())).getTime()
      )
    : [];
  return { blogPosts, arePostsFetching, arePostsLoading, postsError };
};

export default useUserPosts;
