"use client";

import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  Heart,
  Bookmark,
  MessageSquare,
  UserPlus,
  LogIn,
  UserCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GitHubIcon2, GoogleIcon2 } from "./icons";
import { signIn } from "next-auth/react";
import { ModalStep } from "@/typings/types";
import { AuthModalProps } from "@/typings/interfaces";
import { useSessionUserId } from "@/hooks/useSessionUserId";
import { useTranslations } from "next-intl";

export const AuthModal = memo(function AuthModal({
  isOpen,
  onClose,
  action,
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const { refetchUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ModalStep>("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tAuthModal = useTranslations("authModal");
  const tForms = useTranslations("forms");

  // Controlled fields for sign in
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  // Controlled fields for register
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const { userId: sessionUserId } = useSessionUserId();

  useEffect(() => {
    const checkAndRefreshSession = async () => {
      // Only check when modal is closed (after successful auth)
      if (isOpen) return;

      if (sessionUserId) {
        // If we have a session but UI doesn&apos;t reflect it, refresh the auth context
        await refetchUser();
      }
    };

    checkAndRefreshSession();
  }, [isOpen, refetchUser, sessionUserId]);

  const actionConfig = {
    like: {
      icon: Heart,
      title: tAuthModal("likeTitle"),
      description: tAuthModal("likeDescription"),
      actionText: tAuthModal("liking"),
    },
    bookmark: {
      icon: Bookmark,
      title: tAuthModal("bookmarkTitle"),
      description: tAuthModal("bookmarkDescription"),
      actionText: tAuthModal("bookmarking"),
    },
    comment: {
      icon: MessageSquare,
      title: tAuthModal("commentTitle"),
      description: tAuthModal("commentDescription"),
      actionText: tAuthModal("commenting"),
    },
    follow: {
      icon: UserPlus,
      title: tAuthModal("followTitle"),
      description: tAuthModal("followDescription"),
      actionText: tAuthModal("followingAuthors"),
    },
    reply: {
      icon: MessageSquare,
      title: tAuthModal("replyTitle"),
      description: tAuthModal("replyDescription"),
      actionText: tAuthModal("replyingToComments"),
    },
  };
  const config = actionConfig[action];
  const IconComponent = config.icon;

  const handleClose = () => {
    setCurrentStep("initial");
    setShowPassword(false);
    setError(null);
    setIsLoading(false);

    setSigninEmail("");
    setSigninPassword("");
    setRegisterFirstName("");
    setRegisterLastName("");
    setRegisterUsername("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setOauthLoading(null);

    // Close the modal
    onClose();
  };
  const handleSocialLogin = async (provider: "github" | "google") => {
    try {
      setOauthLoading(provider);

      const result = await signIn(provider, {
        callbackUrl: window.location.pathname || "/dashboard",
        redirect: true,
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: tAuthModal("signInFailed"),
          description: tAuthModal("socialSignInError", { provider }),
        });
        return;
      }
      if (result?.url) {
        window.location.href = result.url;
      }

      // Refresh the auth context to update the UI
      await refetchUser();

      handleClose();
      if (onSuccess) onSuccess();
      toast({
        title: "Welcome!",
        description: `You&apos;ve successfully signed in. You can now ${config.actionText}.`,
      });
    } catch (error) {
      console.error(`OAuth error with ${provider}:`, error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: `Could not sign in with ${provider}`,
      });
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: signinEmail,
        password: signinPassword,
        redirect: false,
      });

      if (result?.error) {
        setError(tAuthModal("invalidCredentials"));
        toast({
          variant: "destructive",
          title: tAuthModal("signInFailed"),
          description: tAuthModal("invalidCredentials"),
        });
        return;
      }

      // Refresh the auth context to update the UI
      await refetchUser();

      handleClose();
      if (onSuccess) onSuccess();
      toast({
        title: "Welcome back!",
        description: `You&apos;ve successfully signed in. You can now ${config.actionText}.`,
      });
    } catch (error) {
      setError(tAuthModal("genericSignInError"));
      toast({
        variant: "destructive",
        title: tAuthModal("signInFailed"),
        description: tAuthModal("genericSignInError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateRegisterForm = () => {
    if (!registerFirstName.trim()) return tAuthModal("firstNameRequired");
    if (!registerLastName.trim()) return tAuthModal("lastNameRequired");
    if (!registerUsername.trim()) return tAuthModal("usernameRequired");
    if (!registerEmail.trim()) return tAuthModal("emailRequired");
    if (!registerPassword) return tAuthModal("passwordRequired");
    if (registerPassword.length < 8) return tAuthModal("passwordMinLength");
    if (registerPassword !== registerConfirmPassword)
      return tAuthModal("passwordsMismatch");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail))
      return tAuthModal("invalidEmailFormat");

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(registerUsername))
      return tAuthModal("usernameFormat");

    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validationError = validateRegisterForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: registerFirstName.trim(),
          lastName: registerLastName.trim(),
          username: registerUsername.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }
      const result = await signIn("credentials", {
        email: registerEmail.trim(),
        password: registerPassword,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description:
            "Account created but couldn&apos;t sign in automatically. Please try signing in.",
        });
        setCurrentStep("signin");
        setSigninEmail(registerEmail.trim());
        setIsLoading(false);
        return;
      }

      // Refresh the auth context to update the UI
      await refetchUser();

      handleClose();
      if (onSuccess) onSuccess();
      toast({
        title: "Welcome!",
        description: `Account created successfully. You can now ${config.actionText}.`,
      });
    } catch (error: any) {
      let errorMessage =
        error.message || "Something went wrong during registration";

      // Check for common error messages and provide more user-friendly feedback
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already exists")
      ) {
        if (errorMessage.includes("email")) {
          errorMessage =
            "This email is already registered. Please try signing in instead.";
        } else if (errorMessage.includes("username")) {
          errorMessage =
            "This username is already taken. Please choose a different one.";
        } else {
          errorMessage =
            "An account with these details already exists. Please try signing in.";
        }
      }

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: tAuthModal("registrationFailed"),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  const renderInitialStep = () => (
    <>
      <DialogHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
        <DialogTitle className="text- text-center font-semibold">
          {config.title}
        </DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">
          {config.description}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        {/* OAuth Providers */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleSocialLogin("github")}
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={isLoading || !!oauthLoading}
          >
            {oauthLoading === "github" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitHubIcon2 />
            )}
            GitHub
          </Button>
          <Button
            onClick={() => handleSocialLogin("google")}
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={isLoading || !!oauthLoading}
          >
            {oauthLoading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon2 />
            )}
            Google
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {tCommon("or")}
            </span>
          </div>
        </div>
        {/* Email/Password Login */}
        <div className="space-y-2">
          <Button
            onClick={() => setCurrentStep("signin")}
            className="w-full"
            disabled={isLoading || !!oauthLoading}
          >
            <LogIn className="mr-2 h-4 w-4" /> {tAuth("signInWithEmail")}
          </Button>
          <Button
            onClick={() => setCurrentStep("register")}
            variant="outline"
            className="w-full"
            disabled={isLoading || !!oauthLoading}
          >
            <UserCheck className="mr-2 h-4 w-4" /> {tAuth("createNewAccount")}
          </Button>
        </div>
      </div>
      <div className="pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          {tCommon("byContinuing")}{" "}
          <Link
            href="/terms-of-service"
            className="text-primary hover:underline"
          >
            {tCommon("termsOfService")}
          </Link>{" "}
          {tCommon("and")}{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            {tCommon("privacyPolicy")}
          </Link>
        </p>
      </div>
    </>
  );

  const renderSignInStep = () => (
    <>
      <DialogHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep("initial")}
            className="absolute left-0"
            type="button"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
        </div>
        <DialogTitle className="text-xl text-center font-semibold">
          {tAuthModal("signInTitle")}
        </DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">
          {tAuthModal("signInDescription")}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleEmailSignIn} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">{tAuth("email")}</Label>
          <Input
            id="signin-email"
            name="email"
            type="email"
            placeholder={tForms("emailPlaceholder")}
            required
            disabled={isLoading}
            value={signinEmail}
            onChange={(e) => setSigninEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="signin-password">{tAuth("password")}</Label>
            <Button
              variant="link"
              className="ml-auto text-sm p-0 h-auto"
              onClick={() => router.push("/auth/forgot-password")}
              type="button"
              disabled={isLoading}
            >
              {tAuth("forgotPassword")}
            </Button>
          </div>
          <div className="relative">
            <Input
              id="signin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={tForms("passwordPlaceholder")}
              required
              disabled={isLoading}
              value={signinPassword}
              onChange={(e) => setSigninPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {error && (
          <div className="text-destructive text-sm text-center">{error}</div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !!oauthLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tAuthModal("signingIn")}
            </>
          ) : (
            <>{tAuth("signInWithEmail")}</>
          )}
        </Button>
      </form>
      <div className="pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {tAuthModal("dontHaveAccount")}{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => setCurrentStep("register")}
            disabled={isLoading}
          >
            {tAuthModal("createOneHere")}
          </Button>
        </p>
      </div>
    </>
  );

  const renderRegisterStep = () => (
    <>
      <DialogHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentStep("initial")}
            className="absolute left-0"
            type="button"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
        </div>
        <DialogTitle className="text-xl text-center font-semibold">
          {tAuthModal("registerTitle")}
        </DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">
          {tAuthModal("registerDescription")}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleRegister} className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="register-firstName">{tAuth("firstName")}</Label>
            <Input
              id="register-firstName"
              name="firstName"
              placeholder={tForms("firstNamePlaceholder")}
              required
              disabled={isLoading}
              value={registerFirstName}
              onChange={(e) => setRegisterFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-lastName">{tAuth("lastName")}</Label>
            <Input
              id="register-lastName"
              name="lastName"
              placeholder={tForms("lastNamePlaceholder")}
              required
              disabled={isLoading}
              value={registerLastName}
              onChange={(e) => setRegisterLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-username">{tAuth("username")}</Label>
          <Input
            id="register-username"
            name="username"
            placeholder={tForms("usernamePlaceholder")}
            required
            disabled={isLoading}
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">{tAuth("email")}</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            placeholder={tForms("registerEmailPlaceholder")}
            required
            disabled={isLoading}
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">{tAuth("password")}</Label>
          <div className="relative">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={tForms("createPasswordPlaceholder")}
              required
              disabled={isLoading}
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirmPassword">
            {tAuth("confirmPassword")}
          </Label>
          <div className="relative">
            <Input
              id="register-confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder={tForms("confirmPasswordPlaceholder")}
              required
              disabled={isLoading}
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        {error && (
          <div className="text-destructive text-sm text-center">{error}</div>
        )}
        <Button
          type="submit"
          className="w-full text"
          disabled={isLoading || !!oauthLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tAuthModal("creatingAccount")}
            </>
          ) : (
            tAuthModal("createAccount")
          )}
        </Button>
      </form>
      <div className="pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {tAuth("alreadyHaveAccount")}{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => setCurrentStep("signin")}
            disabled={isLoading}
          >
            {tAuthModal("signInTitle")}
          </Button>
        </p>
      </div>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "signin":
        return renderSignInStep();
      case "register":
        return renderRegisterStep();
      default:
        return renderInitialStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
});
