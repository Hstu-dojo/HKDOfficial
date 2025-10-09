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
        console.log('Initializing password reset form...');
        console.log('Current URL:', window.location.href);
        console.log('Hash params:', window.location.hash);
        
        // Check if we have recovery token in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const isRecoveryType = type === 'recovery';
        
        console.log('Hash params - type:', type, 'access_token exists:', !!accessToken);
        
        if (isRecoveryType && accessToken && refreshToken) {
          console.log('Recovery tokens found in URL hash - setting session');
          
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            if (mounted) setIsValidToken(false);
          } else if (data.session) {
            console.log('Session set successfully from recovery tokens');
            if (mounted) setIsValidToken(true);
          } else {
            console.error('No session created from tokens');
            if (mounted) setIsValidToken(false);
          }
        }

        // Set up auth state listener (always do this to handle state changes)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change event:', event);
          console.log('Session exists:', !!session);
          
          if (!mounted) return;
          
          if (event === 'PASSWORD_RECOVERY' && session) {
            console.log('Password recovery event detected');
            setIsValidToken(true);
          } else if (event === 'SIGNED_IN' && session) {
            console.log('User signed in with recovery session');
            setIsValidToken(true);
          } else if (event === 'INITIAL_SESSION' && session) {
            console.log('Initial session found');
            setIsValidToken(true);
          } else if (!session) {
            console.log('No session - invalid link');
            setIsValidToken(false);
          }
        });

        // If no recovery tokens were found in hash, check current session
        if (!isRecoveryType) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            if (mounted) setIsValidToken(false);
          } else if (session) {
            console.log('Existing session found');
            if (mounted) setIsValidToken(true);
          } else {
            console.log('No session and no recovery tokens - invalid link');
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
  }, [supabase.auth]);

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