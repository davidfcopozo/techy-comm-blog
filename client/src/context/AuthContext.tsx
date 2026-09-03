"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useMemo,
  useCallback,
} from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { signIn, signOut } from "next-auth/react";
import axios from "axios";
import { AuthContextType } from "@/typings/types";
import { useSessionUserId, clearSessionCache } from "@/hooks/useSessionUserId";
import { getCachedRequest, clearCache } from "@/utils/request-cache";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
AuthContext.displayName = "AuthContext";

export const AuthContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const { userId: sessionUserId, isLoading: isSessionLoading } =
    useSessionUserId();

  const {
    data: currentUser,
    refetch: refetchUser,
    isFetching: isUserFetching,
    isLoading: isUserLoading,
    isPending: isUserPending,
  } = useQuery({
    queryKey: ["currentUser", sessionUserId],
    queryFn: async () => {
      if (!sessionUserId) {
        return null;
      }
      try {
        const data = await getCachedRequest(
          `current-user-${sessionUserId}`,
          async () => {
            const response = await axios.get(`/api/auth/me`);
            return response.data;
          }
        );
        return data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!sessionUserId,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always", // Always try to fetch, but use cache when possible
  });

  useEffect(() => {
    const initializeAuth = async () => {
      if (!currentUser && !isUserLoading && !isSessionLoading) {
        await refetchUser();
      }
      setIsLoading(isSessionLoading || isUserLoading);
    };

    initializeAuth();
  }, [currentUser, isUserLoading, isSessionLoading, refetchUser]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsLoading(true);
      try {
        const result = await signIn("credentials", {
          ...credentials,
          redirect: false,
        });
        if (result?.error) {
          throw new Error(result.error);
        }
        setTimeout(async () => {
          clearSessionCache(); // Clear cache so it gets refreshed with new session
          clearCache();
          await refetchUser();
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [refetchUser]
  );

  const socialLogin = useCallback(
    async (provider: "github" | "google") => {
      setIsLoading(true);
      try {
        const result = await signIn(provider, {
          callbackUrl: "/dashboard",
          redirect: true,
        });
        if (result?.error) {
          throw new Error(result.error);
        }
        if (result?.url) {
          window.location.href = result.url;
        }
        setTimeout(async () => {
          clearSessionCache();
          clearCache();
          await refetchUser();
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [refetchUser]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await axios.get("/api/auth/logout");
      await signOut({ callbackUrl: "/" });
      queryClient.setQueryData(["currentUser"], null);
      clearSessionCache();
      clearCache();
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const contextValue = useMemo(
    () => ({
      currentUser,
      isLoading,
      login,
      socialLogin,
      logout,
      isUserFetching,
      isUserLoading,
      isUserPending,
      refetchUser,
    }),
    [
      currentUser,
      isLoading,
      login,
      socialLogin,
      logout,
      isUserFetching,
      isUserLoading,
      isUserPending,
      refetchUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
