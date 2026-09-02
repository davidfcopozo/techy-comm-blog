import { CommentInterface, ReplyInterface } from "@/typings/interfaces";
import useBulkFetch from "./useBulkFetch";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

const useFetchReplies = ({
  ids,
  url,
  comment,
  isExpanded,
  childrenLoaded,
  key,
}: {
  ids: string[];
  key: string;
  url: string;
  comment: CommentInterface;
  isExpanded: boolean;
  childrenLoaded: boolean;
}) => {
  const queryClient = useQueryClient();

  const updateRepliesCache = useCallback((fetchedReplies: ReplyInterface[]) => {
    queryClient.setQueryData(
      ["replies"],
      (oldReplies: ReplyInterface[] = []) => {
        const newReplies = fetchedReplies.filter(
          (reply) => !oldReplies.some((oldReply) => oldReply._id === reply._id)
        );
        return [...oldReplies, ...newReplies];
      }
    );
  }, [queryClient]);

  const {
    data: fetchedReplies,
    isLoading,
    isFetching,
  } = useBulkFetch({
    ids: comment?.replies?.length >= 1 ? comment?.replies : [],
    key,
    url,
    // Only fetch if expanded or children not yet loaded
    dependantItem: isExpanded && !childrenLoaded,
  });

  // Update the cache only when fetchedReplies changes
  useEffect(() => {
    if (fetchedReplies && Array.isArray(fetchedReplies)) {
      updateRepliesCache(fetchedReplies as unknown as ReplyInterface[]);
    }
  }, [fetchedReplies, updateRepliesCache]);

  return { fetchedReplies, isLoading, isFetching };
};

export default useFetchReplies;
