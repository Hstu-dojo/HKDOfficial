"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, set up auth state listener for password recovery events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change event:', event);
          console.log('Session:', session);
          
          if (!mounted) return;
          
          if (event === 'PASSWORD_RECOVERY') {
            console.log('Password recovery event detected');
            setIsValidToken(true);
          } else if (event === 'SIGNED_IN' && session) {
            console.log('User signed in during recovery flow');
            setIsValidToken(true);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setIsValidToken(false);
          }
        });

        // Get the code from URL parameters
        const code = searchParams ? searchParams.get('code') : null;
        
        if (code) {
          console.log('Found auth code in URL:', code);
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Code exchange error:', error);
            if (mounted) setIsValidToken(false);
            return;
          }
          
          console.log('Code exchange successful:', data);
          
          // The auth state change listener will handle setting isValidToken
        } else {
          console.log('No auth code found, checking existing session');
          
          // Check if we already have a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            if (mounted) setIsValidToken(false);
          } else if (session) {
            console.log('Existing session found:', session);
            if (mounted) setIsValidToken(true);
          } else {
            console.log('No session found - invalid reset link');
            if (mounted) setIsValidToken(false);
          }
        }

        // Cleanup function
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setIsValidToken(false);
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [supabase.auth, searchParams]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    if (!password) {
      toast.error("Please enter a password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully");
      router.push("/login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading while checking token validity
  if (isValidToken === null) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Verifying reset link...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Invalid or Expired Link
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>
              This password reset link is invalid or has expired.
            </p>
            <p className="mt-1">
              Please request a new password reset link.
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => router.push("/en/forget")}
          className="w-full"
        >
          Request New Reset Link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Updating Password..." : "Update Password"}
      </Button>
    </form>
  );
}