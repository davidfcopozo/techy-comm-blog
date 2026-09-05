"use client";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LogoIcon } from "./ui/icons";
import { ModeToggle } from "./ui/mode-toggle";
import { LanguageSwitcher } from "./ui/language-switcher";
import { useTheme } from "next-themes";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { PostType } from "@/typings/types";
import { useRouter } from "next/navigation";
import NotificationBell from "./notification-bell";
import { UserAvatar } from "./ui/user-avatar";

export function Header() {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const { theme, systemTheme } = useTheme();
  const { data: session, status } = useSession();
  const [darkTheme, setDarkTheme] = useState("#000000");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { toast } = useToast();
  const { logout, currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const posts = queryClient.getQueryData(["posts"]) as { data: PostType[] };

  const handleSignout = async (e: FormEvent): Promise<any> => {
    e.preventDefault();
    try {
      await logout();
    } catch (error: Error | any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please try again.",
      });
    }
  };

  useEffect(() => {
    setDarkTheme(
      theme === "dark"
        ? "#ffffff"
        : theme === "light"
        ? "#000000"
        : systemTheme === "dark"
        ? "#ffffff"
        : "#000000"
    );
  }, [theme, systemTheme, session]);

  const filteredPosts = useMemo(() => {
    if (!posts?.data || !Array.isArray(posts.data)) {
      return [];
    }
    return posts?.data
      ?.filter((post: PostType) =>
        post?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [posts, searchQuery]);

  return (
    <header className="fixed w-full top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0"
      >
        <LogoIcon
          width="64"
          height="64"
          color={darkTheme}
          className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0"
        />
        <span className="sr-only">TechyComm logo</span>
      </Link>

      {/* Desktop/Tablet inline search (hidden on mobile and large screens) */}
      <form className="ml-auto hidden sm:block lg:hidden relative flex-1 max-w-[200px] md:max-w-[260px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search")}
            className="pl-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none w-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {filteredPosts &&
            filteredPosts?.length > 0 &&
            isFocused &&
            searchQuery && (
              <div className="absolute mt-2 bg-background rounded-md border shadow-lg w-full z-30">
                {filteredPosts?.map((post: PostType) => (
                  <Link
                    key={`${post._id}`}
                    href={`/blog/${post.slug}`}
                    className="block px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    prefetch={false}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={() => router.push(`/blog/${post.slug}`)}
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            )}
        </div>
      </form>

      <nav className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
        {/* Mobile search toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => setIsMobileSearchOpen((prev) => !prev)}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">{t("search")}</span>
        </Button>
        <LanguageSwitcher />
        <ModeToggle />
        {status === "authenticated" && <NotificationBell />}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
        {status === "unauthenticated" ? (
          <>
            <Link
              href="/login"
              className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground px-1 whitespace-nowrap"
            >
              {tAuth("signIn")}
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-9 px-2.5 sm:px-3 inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full shrink-0"
            >
              {tAuth("signUp")}
              <span className="sr-only">{tAuth("signUp")}</span>
            </Link>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full p-0 overflow-hidden h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              >
                <UserAvatar
                  user={currentUser?.data}
                  size="sm"
                  className="border-0"
                  isLoading={status === "loading"}
                />
                <span className="sr-only">{tCommon("toggleUserMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tCommon("myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">{t("profile")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">{t("dashboard")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">{t("settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleSignout(e)}>
                {tAuth("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mobile search drawer */}
      {isMobileSearchOpen && (
        <div className="absolute top-16 left-0 w-full bg-background border-b shadow-md p-2.5 sm:hidden z-20 flex flex-col gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              autoFocus
              placeholder={t("search")}
              className="pl-9 pr-9 h-9 rounded-full w-full text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close search</span>
            </Button>
          </div>
          {filteredPosts && filteredPosts.length > 0 && searchQuery && (
            <div className="bg-background rounded-lg border shadow-sm max-h-60 overflow-y-auto divide-y">
              {filteredPosts.map((post: PostType) => (
                <Link
                  key={`${post._id}`}
                  href={`/blog/${post.slug}`}
                  className="block px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  {post.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
