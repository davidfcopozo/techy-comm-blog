import React, { memo } from "react";
import { Github, XIcon, Linkedin, Globe } from "lucide-react";
import Image from "next/image";
import { AuthorPanelProps, SocialMediaConfig } from "@/typings/interfaces";
import { Button } from "./ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

const socialMediaConfig: Record<string, SocialMediaConfig> = {
  x: {
    icon: XIcon,
    getUrl: (username: string) => `https://x.com/${username}`,
    label: "X (Formerly Twitter) Profile",
  },
  github: {
    icon: Github,
    getUrl: (username: string) => `https://github.com/${username}`,
    label: "GitHub Profile",
  },
  linkedin: {
    icon: Linkedin,
    getUrl: (username: string) => `https://linkedin.com/in/${username}`,
    label: "LinkedIn Profile",
  },
  website: {
    icon: Globe,
    getUrl: (url: string) => (url.startsWith("http") ? url : `https://${url}`),
    label: "Personal Website",
  },
};

export const AuthorPanel = memo(function AuthorPanel({
  firstName,
  lastName,
  username,
  avatar,
  bio,
  website,
  title,
  socialMedia,
  handleFollowToggle,
  isFollowed,
  isPending,
  isPostOwner = false,
  isPreview = false,
}: AuthorPanelProps) {
  const t = useTranslations("blog");
  const fullName = `${firstName} ${lastName}`;

  const availableSocialMedia = [
    // Only add website if it exists
    ...(website ? [{ type: "website" as const, username: website }] : []),
    // Filter out social media profiles that exist
    ...Object.entries(socialMedia || {})
      // Only include if username exists
      .filter(([_, username]) => username)
      .map(([type, username]) => ({
        type: type as keyof typeof socialMediaConfig,
        username,
      })),
  ];
  return (
    <article
      className="w-full lg:w-72 p-6 bg-muted shadow-sm rounded-lg"
      aria-labelledby="author-name"
    >
      <header className="flex flex-col items-center text-center">
        <figure className="mb-4">
          <Image
            src={avatar}
            alt={`${fullName}'s profile picture`}
            className="w-24 h-24 rounded-full"
            width={500}
            height={500}
            style={{ objectFit: "cover" }}
          />
        </figure>
        <Link href={`/${username}`} passHref>
          <h1
            id="author-name"
            className="text-xl font-semibold text-foreground hover:text-[hsl(var(--thread-border))] transition-all duration-300"
          >
            {fullName}
          </h1>
        </Link>
        {title && (
          <p
            className="text-sm text-muted-foreground mt-1"
            aria-label="Professional title"
          >
            {title}
          </p>
        )}
      </header>

      {bio && (
        <section aria-label="Biography" className="mt-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground">{bio}</p>
        </section>
      )}

      {availableSocialMedia.length > 0 && (
        <nav aria-label="Social media profiles" className="mb-6">
          <ul className="flex gap-4 justify-center">
            {availableSocialMedia.map(({ type, username }) => {
              if (!socialMediaConfig[type]) return null;

              const { icon: Icon, getUrl, label } = socialMediaConfig[type];

              return (
                <li key={type}>
                  <a
                    href={getUrl(username as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label={`Visit ${fullName}'s ${label}`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <footer className="mt-4">
        {!isPostOwner && (
          <Button
            onClick={isPreview ? undefined : handleFollowToggle}
            disabled={isPending || isPreview}
            title={isPreview ? t("actionsDisabledInPreview") : undefined}
            className={`${
              isFollowed
                ? "dark:text-amber-500 text-foreground dark:border-amber-500 border-foreground border-[1px] hover:bg-foreground hover:dark:text-background hover:text-background transition-all duration-300 following-button"
                : "text-background hover:dark:bg-transparent hover:dark:text-amber-500 hover:bg-transparent hover:border-foreground hover:text-foreground transition-all duration-300 hover:dark:border-amber-500 hover:border-[1px]"
            } w-full py-2 px-4 font-bold`}
            aria-label={`Follow ${fullName}`}
            variant={isFollowed ? "secondary" : "default"}
            data-following={isFollowed ? "true" : "false"}
          >
            <span className="follow-text">
              {isFollowed ? t("following") : t("follow")}
            </span>
            <span className="unfollow-text hidden">{t("unfollow")}</span>
          </Button>
        )}
      </footer>
    </article>
  );
});
