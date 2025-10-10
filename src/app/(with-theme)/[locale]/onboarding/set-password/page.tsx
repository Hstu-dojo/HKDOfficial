"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { FaGoogle, FaGithub, FaEye, FaEyeSlash } from "react-icons/fa6";
import Link from "next/link";

interface OAuthUserData {
  supabaseUserId: string;
  email: string;
  provider: string;
  fullName?: string;
  avatarUrl?: string;
}

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<OAuthUserData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!searchParams) {
      router.push('/en/login');
      return;
    }
    
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setUserData(parsed);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        toast.error("Invalid data. Please try signing in again.");
        router.push('/en/login');
      }
    } else {
      // No data provided, redirect to login
      router.push('/en/login');
    }
  }, [searchParams, router]);

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <FaGoogle className="h-5 w-5" />;
      case 'github':
        return <FaGithub className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error("Missing user data");
      return;
    }

    // Validation
    if (password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are the same",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Add password to OAuth account
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Create local database record
      const response = await fetch('/api/auth/create-oauth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: userData.supabaseUserId,
          email: userData.email,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          provider: userData.provider,
          hasPassword: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user account');
      }

      toast.success("Account setup complete! 🎉", {
        description: "You can now login with email/password or your social account",
      });

      router.push('/en/profile');
    } catch (error: any) {
      console.error('Set password error:', error);
      toast.error("Failed to set password", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!userData) return;

    setIsLoading(true);

    try {
      // Create local database record without password
      const response = await fetch('/api/auth/create-oauth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: userData.supabaseUserId,
          email: userData.email,
          fullName: userData.fullName,
          avatarUrl: userData.avatarUrl,
          provider: userData.provider,
          hasPassword: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user account');
      }

      toast.success("Welcome! 🎉", {
        description: "You can add a password later from your profile settings",
      });

      router.push('/en/profile');
    } catch (error: any) {
      console.error('Skip error:', error);
      toast.error("Failed to complete setup", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              {getProviderIcon(userData.provider)}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Complete Your Account</CardTitle>
          <CardDescription className="text-center">
            You signed in with {userData.provider}. Set a password to also login with your email.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="text-muted-foreground">
                💡 <strong>Why set a password?</strong>
              </p>
              <p className="text-muted-foreground mt-1">
                You&apos;ll be able to login with both your {userData.provider} account and email/password.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Setting up...
                </>
              ) : (
                "Set Password & Continue"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for now
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              You can always add a password later from your{" "}
              <Link href="/en/profile" className="text-primary hover:underline">
                profile settings
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
