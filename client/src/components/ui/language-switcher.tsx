"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useUpdateSettings } from "@/hooks/useUpdateSettings";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { updateLocale } = useUpdateSettings();

  const switchLanguage = (newLocale: Locale) => {
    startTransition(() => {
      // Remove the current locale from the pathname
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

      if (currentUser) {
        updateLocale(newLocale);

        toast({
          title: t("languageChanged"),
          description: `${t("languageUpdated")} ${getLanguageLabel(newLocale)}`,
        });
      } else {
        toast({
          title: t("languageChanged"),
          description: getLanguageLabel(newLocale),
        });
      }

      // Navigate to the new locale
      router.push(`/${newLocale}${pathWithoutLocale}`);
    });
  };

  const getLanguageLabel = (locale: string) => {
    switch (locale) {
      case "en":
        return t("english");
      case "es":
        return t("spanish");
      default:
        return locale;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-1.5 sm:px-2 text-xs"
          disabled={isPending}
        >
          <Globe className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{getLanguageLabel(locale)}</span>
          <span className="inline sm:hidden uppercase font-medium text-[11px] ml-1">
            {locale}
          </span>
          <span className="sr-only">{t("selectLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLanguage(loc)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{getLanguageLabel(loc)}</span>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
