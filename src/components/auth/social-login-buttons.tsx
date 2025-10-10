"use client";

import { useState } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/supabase";
import { toast } from "sonner";

interface SocialLoginButtonsProps {
  redirectTo?: string;
}

export function SocialLoginButtons({ redirectTo = "/auth/callback" }: SocialLoginButtonsProps) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      // Set loading state
      if (provider === 'google') setIsLoadingGoogle(true);
      if (provider === 'github') setIsLoadingGithub(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error(`${provider} OAuth error:`, error);
        toast.error(`Failed to sign in with ${provider}`, {
          description: error.message,
        });
        
        // Reset loading state on error
        if (provider === 'google') setIsLoadingGoogle(false);
        if (provider === 'github') setIsLoadingGithub(false);
      }
      
      // Note: If successful, user will be redirected, so no need to reset loading
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
      
      // Reset loading state
      if (provider === 'google') setIsLoadingGoogle(false);
      if (provider === 'github') setIsLoadingGithub(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoadingGoogle || isLoadingGithub}
          className="w-full"
        >
          {isLoadingGoogle ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FaGoogle className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSocialLogin('github')}
          disabled={isLoadingGoogle || isLoadingGithub}
          className="w-full"
        >
          {isLoadingGithub ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <FaGithub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </Button>
      </div>
    </div>
  );
}
