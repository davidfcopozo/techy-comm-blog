"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getNameInitials } from "@/utils/formats";
import { UserType } from "@/typings/types";

interface UserAvatarProps {
  user: UserType | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isLoading?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-48 w-48",
};

export function UserAvatar({
  user,
  size = "md",
  className,
  isLoading = false,
}: UserAvatarProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse bg-muted rounded-full border",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <Avatar className={cn("border", sizeClasses[size], className)}>
      <AvatarImage
        src={user?.avatar?.toString() || undefined}
        alt={`${user?.firstName || user?.username || "User"}'s avatar`}
      />
      <AvatarFallback className={size === "xl" ? "text-lg font-bold" : ""}>
        {user ? getNameInitials(user) : "TC"}
      </AvatarFallback>
    </Avatar>
  );
}
