const SESSION_STORAGE_KEY = "blog_visitor_session_id";

/**
 * Retrieves an existing visitor session ID from localStorage or generates and persists a new one.
 * Safe for execution in both client-side and SSR environments.
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        sessionId = crypto.randomUUID();
      } else {
        sessionId = `sess_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`;
      }
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.warn("Unable to access localStorage for visitor session ID:", error);
    return "";
  }
};
