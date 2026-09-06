"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  User,
  MapPin,
  Sparkles,
  Code2,
  Users,
  Zap,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Code,
  Github,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  const t = useTranslations("aboutPage");
  const tCommon = useTranslations("common");

  const techStack = [
    "Next.js 16 (App Router)",
    "TypeScript",
    "Tailwind CSS",
    "NextIntl (i18n)",
    "NextAuth.js",
    "MongoDB & Supabase",
    "TanStack Query",
    "Lucide Icons",
  ];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pt-24 sm:py-12 sm:pt-28">
      {/* Navigation */}
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          {tCommon("back")}
        </Link>
      </Button>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-6 sm:p-10 border shadow-sm mb-10">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 rounded-full bg-primary/10 border-primary/20 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              About the Platform
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 rounded-full bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Code className="w-3.5 h-3.5" />
              100% Open Source
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            {t("title")}
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Globe className="w-72 h-72 text-primary" />
        </div>
      </div>

      {/* Open Source Banner */}
      <Card className="border bg-gradient-to-r from-emerald-500/10 via-card to-blue-500/10 backdrop-blur-sm mb-10">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              {t("openSourceTitle")}
            </CardTitle>
            <Badge className="mt-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 border-0 rounded-full">
              Community Driven
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("openSourceDescription")}
          </p>
        </CardContent>
      </Card>

      {/* Creator Profile Card */}
      <Card className="border bg-card/70 backdrop-blur-sm shadow-md mb-10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 h-24 w-full" />
        <CardContent className="-mt-12 pt-0 sm:flex sm:items-start sm:gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 p-1 shadow-lg shrink-0 mb-4 sm:mb-0">
            <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center text-primary">
              <User className="w-12 h-12" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("creatorName")}
                </h2>
                <p className="text-sm text-primary font-medium flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {t("creatorLocation")}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-full px-3 py-1">
                Founder & Open Source Developer
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
              {t("creatorBio")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <Card className="border bg-card/60 backdrop-blur-sm mb-10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl text-primary bg-primary/10">
              <Globe className="w-6 h-6" />
            </div>
            {t("missionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("missionDescription")}
          </p>
        </CardContent>
      </Card>

      {/* Core Principles Grid */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {t("valuesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border bg-card/50 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="p-2.5 w-fit rounded-xl text-blue-500 bg-blue-500/10 mb-2">
                <Code2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {t("values.quality.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("values.quality.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card/50 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="p-2.5 w-fit rounded-xl text-purple-500 bg-purple-500/10 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {t("values.community.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("values.community.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="border bg-card/50 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="p-2.5 w-fit rounded-xl text-amber-500 bg-amber-500/10 mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {t("values.performance.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("values.performance.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack Pills */}
      <Card className="border bg-card/60 backdrop-blur-sm mb-10">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            {t("techStackTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2.5">
            {techStack.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="px-3.5 py-1.5 text-xs font-medium rounded-xl gap-1.5 bg-muted/60 hover:bg-muted"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Legal links card */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-gradient-to-r from-primary/5 via-background to-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {t("contactTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("contactDescription")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/terms">{tCommon("termsOfService")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/privacy">{tCommon("privacyPolicy")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
