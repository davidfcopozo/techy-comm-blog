import React, { useEffect, memo, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Facebook,
  Linkedin,
  Mail,
  Link,
  Share2,
  MessageCircle,
  XIcon,
} from "lucide-react";
import { useToast } from "./ui/use-toast";
import { PostType } from "@/typings/types";
import useSharePost from "@/hooks/useSharePost";
import { useTranslations } from "next-intl";

export const ShareButton = memo(function ShareButton({
  post,
  disabled = false,
}: {
  post: PostType;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const { sharePost } = useSharePost();
  const t = useTranslations("blog.share");
  const tBlog = useTranslations("blog");

  const [shareUrl, setShareUrl] = React.useState("");

  const postSlug = useMemo(() => post.slug, [post.slug]);

  useEffect(() => {
    setShareUrl(
      `${window.location.origin}/${post.postedBy.username}/${postSlug}`
    );
  }, [postSlug, post.postedBy.username]);

  const handleShare = (
    shareType:
      | "facebook"
      | "x"
      | "linkedin"
      | "email"
      | "copy-link"
      | "native"
      | "whatsapp"
  ) => {
    sharePost({
      postId: post._id,
      shareType,
    });
  };

  // Check if native sharing is available
  const canUseNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const handleNativeShare = () => {
    if (canUseNativeShare) {
      navigator
        .share({
          title: post.title,
          text: post.title,
          url: shareUrl,
        })
        .then(() => {
          handleShare("native");
        })
        .catch((error) => {
          console.error("Error sharing:", error);
          // Fallback to copy link if native sharing fails
          navigator.clipboard.writeText(shareUrl).then(() => {
            toast({
              description: "Link copied to clipboard",
            });
            handleShare("copy-link");
          });
        });
    }
  };

  const shareOptions = [
    ...(canUseNativeShare
      ? [
          {
            name: t("nativeShare"),
            icon: Share2,
            action: handleNativeShare,
          },
        ]
      : []),
    {
      name: t("facebook"),
      icon: Facebook,
      action: () => {
        const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(fbShareUrl, "_blank");
        handleShare("facebook");
      },
    },
    {
      name: t("twitter"),
      icon: XIcon,
      action: () => {
        const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
          post.title
        )}&url=${encodeURIComponent(shareUrl)}`;
        window.open(xShareUrl, "_blank");
        handleShare("x");
      },
    },
    {
      name: t("linkedin"),
      icon: Linkedin,
      action: () => {
        const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(linkedinShareUrl, "_blank");
        handleShare("linkedin");
      },
    },
    {
      name: t("whatsapp"),
      icon: MessageCircle,
      action: () => {
        const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
          `${post.title}\n\n${shareUrl}`
        )}`;
        window.open(whatsappShareUrl, "_blank");
        handleShare("whatsapp");
      },
    },
    {
      name: t("email"),
      icon: Mail,
      action: () => {
        const subject = encodeURIComponent(
          t("emailSubject", { title: post.title })
        );
        const body = encodeURIComponent(
          t("emailBody", { title: post.title, url: shareUrl })
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        handleShare("email");
      },
    },
    {
      name: t("copyLink"),
      icon: Link,
      action: () => {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            toast({
              description: t("linkCopied"),
            });
            handleShare("copy-link");
          })
          .catch(() => {
            toast({
              variant: "destructive",
              title: t("error"),
              description: t("linkCopyFailed"),
            });
          });
      },
    },
  ];

  if (disabled) {
    return (
      <button
        disabled
        title={tBlog("actionsDisabledInPreview")}
        className="flex flex-col items-center justify-center text-gray-400 p-2 rounded-lg transition-colors duration-200 outline-none opacity-50 cursor-not-allowed"
      >
        <Share2 className="h-5 w-5" />
        <span className="text-xs mt-1">{post.sharesCount || 0}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex flex-col items-center justify-center text-gray-400 hover:text-[#1d9bf0] p-2 rounded-lg transition-colors duration-200 outline-none">
          <Share2 className="h-5 w-5" />
          <span className="text-xs mt-1">{post.sharesCount || 0}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.name}
            onSelect={(e) => {
              e.preventDefault();
              option.action();
            }}
            className="pointer-events-pointer hover:bg-[rgba(29,155,240,0.6)]"
          >
            <option.icon className="mr-2 h-4 w-4" />
            <span>
              {t("share")} {option.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
