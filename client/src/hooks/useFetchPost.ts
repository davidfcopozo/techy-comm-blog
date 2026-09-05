import useFetchRequest from "./useFetchRequest";

const useFetchPost = (slug: string, options: Record<string, any> = {}) => {
  const { data, error, isLoading, isFetching, isPending } = useFetchRequest(
    ["post", slug],
    slug ? `/api/posts/${slug}` : null,
    {
      staleTime: 0,
      skipCustomCache: true,
      refetchOnMount: "always",
      ...options,
    }
  );

  return { data, error, isLoading, isFetching, isPending };
};

export default useFetchPost;
