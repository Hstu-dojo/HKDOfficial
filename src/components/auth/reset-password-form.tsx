"use client";

import { useState, useEffect, useRef } from "react";
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
  const [resetCode, setResetCode] = useState<string | null>(null);
  const hasResetCodeRef = useRef(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing password reset form...');
        console.log('Current URL:', window.location.href);
        
        // Check if we already have a valid session (user came from auth callback)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          if (mounted) setIsValidToken(false);
          return;
        }
        
        if (session) {
          console.log('Valid session found - user can reset password');
          hasResetCodeRef.current = true;
          if (mounted) setIsValidToken(true);
        } else {
          console.log('No session found - checking for auth code or recovery tokens');
          
          // Check for code parameter (Supabase PKCE flow)
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          
          if (code) {
            console.log('Password reset code found in URL (PKCE flow):', code);
            
            // Exchange the code for a session
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              
              if (error) {
                console.error('Error exchanging code for session:', error);
                if (mounted) setIsValidToken(false);
              } else if (data.session) {
                console.log('Session created successfully from PKCE code');
                hasResetCodeRef.current = true;
                if (mounted) setIsValidToken(true);
              } else {
                console.error('No session created from PKCE code');
                if (mounted) setIsValidToken(false);
              }
            } catch (error) {
              console.error('Exception during code exchange:', error);
              if (mounted) setIsValidToken(false);
            }
          } else {
            // Check for hash parameters (legacy/direct flow)
            console.log('Checking URL hash for recovery tokens...');
            
            // Wait a bit for Supabase client to process hash parameters
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check session again after giving Supabase time to process
            const { data: { session: updatedSession } } = await supabase.auth.getSession();
            
            if (updatedSession) {
              console.log('Session found after hash processing');
              hasResetCodeRef.current = true;
              if (mounted) setIsValidToken(true);
            } else {
              // Check if we have recovery token in URL hash (direct Supabase redirect)
              const hashParams = new URLSearchParams(window.location.hash.substring(1));
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');
              const type = hashParams.get('type');
              
              console.log('Hash params - type:', type, 'access_token exists:', !!accessToken);
              console.log('Access token value:', accessToken?.substring(0, 20) + '...');
              
              if (type === 'recovery' && accessToken) {
                // Check if this is a PKCE token (starts with pkce_)
                if (accessToken.startsWith('pkce_')) {
                  console.log('PKCE access token detected in hash');
                  console.warn('PKCE flow detected - Supabase client should auto-process this');
                  
                  // For PKCE tokens, Supabase client library should automatically process them
                  // Let's give it more time and check multiple times
                  let attempts = 0;
                  const maxAttempts = 5;
                  
                  while (attempts < maxAttempts && mounted) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const { data: { session: checkSession } } = await supabase.auth.getSession();
                    
                    if (checkSession) {
                      console.log(`Session found after ${attempts + 1} attempts`);
                      hasResetCodeRef.current = true;
                      if (mounted) setIsValidToken(true);
                      break;
                    }
                    
                    attempts++;
                    console.log(`Waiting for session creation, attempt ${attempts}/${maxAttempts}`);
                  }
                  
                  if (attempts >= maxAttempts) {
                    console.error('Session was not created after multiple attempts');
                    console.log('Storing PKCE token for API fallback');
                    setResetCode(accessToken);
                    hasResetCodeRef.current = true;
                    if (mounted) setIsValidToken(true);
                  }
                } else if (refreshToken) {
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
                } else {
                  console.log('Access token without refresh token - invalid reset link');
                  if (mounted) setIsValidToken(false);
                }
              } else {
                console.log('No valid session, auth code, or recovery tokens - invalid reset link');
                if (mounted) setIsValidToken(false);
              }
            }
          }
        }

        // Set up auth state listener (always do this to handle state changes)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change event:', event);
          console.log('Session exists:', !!session);
          
          if (!mounted) return;
          
          // Don't override isValidToken if we already detected a reset code
          if (hasResetCodeRef.current) {
            console.log('Reset code already detected, ignoring auth state change');
            return;
          }
          
          if (event === 'PASSWORD_RECOVERY') {
            console.log('PASSWORD_RECOVERY event detected - valid reset session');
            hasResetCodeRef.current = true;
            setIsValidToken(true);
          } else if (event === 'SIGNED_IN' && session) {
            console.log('User signed in with recovery session');
            hasResetCodeRef.current = true;
            setIsValidToken(true);
          } else if (event === 'INITIAL_SESSION' && session) {
            console.log('Initial session found');
            setIsValidToken(true);
          } else if (!session && event === 'INITIAL_SESSION') {
            console.log('No initial session - waiting for recovery tokens');
            // Don't set to false yet, give Supabase time to process hash
          }
        });



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
      // First, always check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User has an established session - update password directly using Supabase client
        console.log('Updating password for authenticated user with active session');
        
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (updateError) {
          console.error('Password update error:', updateError);
          throw updateError;
        }

        console.log('Password updated successfully via session');
        toast.success("Password updated successfully");
        
        // Sign out after password reset for security
        await supabase.auth.signOut();
        
        router.push("/en/login");
      } else if (resetCode) {
        // No session but we have a reset code - use API endpoint to handle it
        console.log('No session found, resetting password using code via API');
        
        const response = await fetch('/api/auth/update-password-with-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: resetCode,
            password: password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to reset password');
        }

        toast.success("Password updated successfully");
        router.push("/en/login");
      } else {
        // No session and no reset code - this shouldn't happen
        console.error('No session or reset code available');
        throw new Error('Unable to reset password - no valid session or reset code');
      }
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