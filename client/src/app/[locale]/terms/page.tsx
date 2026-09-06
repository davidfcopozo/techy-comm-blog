"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FileText,
  ShieldCheck,
  UserCheck,
  Scale,
  Lock,
  Globe,
  Mail,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Code,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  const t = useTranslations("termsPage");
  const tCommon = useTranslations("common");

  const sections = [
    {
      key: "identification",
      icon: Globe,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      key: "acceptance",
      icon: Scale,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      key: "openSourceDisclaimer",
      icon: Code,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      key: "account",
      icon: UserCheck,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      key: "intellectualProperty",
      icon: FileText,
      color: "text-cyan-500 bg-cyan-500/10",
    },
    {
      key: "acceptableUse",
      icon: Lock,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      key: "hostingSafeHarbor",
      icon: ShieldCheck,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      key: "liability",
      icon: AlertTriangle,
      color: "text-red-500 bg-red-500/10",
    },
    {
      key: "indemnification",
      icon: ShieldAlert,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      key: "governingLaw",
      icon: Scale,
      color: "text-teal-500 bg-teal-500/10",
    },
    {
      key: "contact",
      icon: Mail,
      color: "text-pink-500 bg-pink-500/10",
    },
  ];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pt-24 sm:py-12 sm:pt-28">
      {/* Top Header & Navigation */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            {tCommon("back")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 rounded-full bg-primary/5 border-primary/20 text-primary">
            <FileText className="w-3.5 h-3.5" />
            Open Source Legal Document
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 rounded-full bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            EU & Spanish Law Compliant
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t("lastUpdated")}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <Separator className="my-8" />

      {/* Terms Sections */}
      <div className="space-y-6">
        {sections.map(({ key, icon: Icon, color }) => (
          <Card key={key} className="border bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold">
                {t(`sections.${key}.title`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-2">
                {t(`sections.${key}.content`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Navigation Cards */}
      <div className="mt-12 p-6 rounded-2xl border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground text-sm sm:text-base">
            Need further legal details or privacy info?
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review how your data is handled under European law.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/privacy">{tCommon("privacyPolicy")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/about">About TechyComm</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
