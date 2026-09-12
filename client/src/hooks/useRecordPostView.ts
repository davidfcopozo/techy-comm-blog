"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { useSessionUserId } from "./useSessionUserId";
import { getOrCreateSessionId } from "@/lib/session";

/**
 * Dedicated hook to record a post view count strictly on the single post client view.
 * Deduplicates in localStorage, excludes post author views, and sends persistent visitor headers.
 */
export const useRecordPostView = (
  postId?: string,
  postAuthorId?: string
) => {
  const { userId, isLoading: isSessionLoading } = useSessionUserId();
  const recordedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // 1. Guard against missing postId, server rendering, or loading auth session
    if (!postId || typeof window === "undefined" || isSessionLoading) {
      return;
    }

    // 2. Prevent duplicate execution in memory (e.g., React Strict Mode double-invocation)
    if (recordedRef.current[postId]) {
      return;
    }

    const storageKey = `viewed_post_${postId}`;

    // 3. Prevent duplicate requests if already marked as viewed in localStorage
    try {
      if (localStorage.getItem(storageKey)) {
        recordedRef.current[postId] = true;
        return;
      }
    } catch {
      // Ignore localStorage access errors (e.g., strict privacy modes)
    }

    // 4. Post owner exclusion (client check)
    const normalizedUserId = userId ? String(userId) : null;
    const normalizedAuthorId = postAuthorId ? String(postAuthorId) : null;
    if (
      normalizedUserId &&
      normalizedAuthorId &&
      normalizedUserId === normalizedAuthorId
    ) {
      try {
        localStorage.setItem(storageKey, "true");
      } catch {}
      recordedRef.current[postId] = true;
      return;
    }

    // Mark ref immediately to prevent simultaneous in-flight requests
    recordedRef.current[postId] = true;

    const sessionId = getOrCreateSessionId();

    const recordView = async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (sessionId) {
          headers["X-Session-ID"] = sessionId;
        }

        if (normalizedUserId) {
          headers["X-User-ID"] = normalizedUserId;
        }

        const res = await axios.post(
          `/api/posts/${postId}/views`,
          {
            sessionId,
            source: "direct",
          },
          { headers }
        );

        if (res.status >= 200 && res.status < 300) {
          try {
            localStorage.setItem(storageKey, "true");
          } catch {}
        }
      } catch (err) {
        // Allow retry on subsequent renders if network request failed
        recordedRef.current[postId] = false;
        console.error("Failed to record post view:", err);
      }
    };

    recordView();
  }, [postId, postAuthorId, userId, isSessionLoading]);
};

export default useRecordPostView;
