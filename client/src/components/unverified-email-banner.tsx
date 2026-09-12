"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export function UnverifiedEmailBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // If user is verified or not logged in, don't show the banner
  if (!currentUser?.data || currentUser.data.verified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: currentUser.data.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
      }

      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to resend verification email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleNavigateToSettings = () => {
    router.push("/settings/profile");
  };

  //check if the page is the dashboard page
  const isDashboardPage = pathname?.includes("/dashboard");

  return (
    <Alert
      className={`relative border-amber-500 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 mt-16 ${
        isDashboardPage ? "!w-[95vw] ml-auto" : "!w-100"
      }`}
    >
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-2 rounded-full p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pr-8">
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <span className="font-medium">
            Your email address hasn&apos;t been verified.
          </span>{" "}
          Please verify {currentUser.data.email} to access all features of our
          blog.
        </AlertDescription>
        <div className="flex flex-wrap gap-2 mt-1 sm:mt-0 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 bg-transparent text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend verification"}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600"
            onClick={handleNavigateToSettings}
          >
            Go to settings
          </Button>
        </div>
      </div>
    </Alert>
  );
}
