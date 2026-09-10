import useFetchRequest from "./useFetchRequest";

interface FetchPostOptions extends Record<string, any> {
  mode?: string;
  skipCount?: boolean;
}

const useFetchPost = (slug: string, options: FetchPostOptions = {}) => {
  const { mode, skipCount, ...queryOptions } = options;

  const queryParams = new URLSearchParams();
  if (mode) queryParams.set("mode", mode);
  if (skipCount) queryParams.set("skipCount", "true");
  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  const queryKey =
    mode || skipCount
      ? ["post", slug, { mode, skipCount }]
      : ["post", slug];

  const { data, error, isLoading, isFetching, isPending } = useFetchRequest(
    queryKey,
    slug ? `/api/posts/${slug}${queryString}` : null,
    {
      staleTime: 0,
      skipCustomCache: true,
      refetchOnMount: "always",
      ...queryOptions,
    }
  );

  return { data, error, isLoading, isFetching, isPending };
};

export default useFetchPost;
