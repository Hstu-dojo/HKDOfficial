"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface SetupPasswordFormProps extends React.HTMLAttributes<HTMLDivElement> {
  email?: string;
  provider?: string;
  callbackUrl?: string;
}

export function SetupPasswordForm({ 
  className, 
  email, 
  provider, 
  callbackUrl,
  ...props 
}: SetupPasswordFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Hash the password and update the user
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password,
          provider 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Password set successfully! You can now login with email and password.");
        router.push(callbackUrl || "/en/profile");
      } else {
        toast.error(result.error || "Failed to set password");
      }
    } catch (error) {
      console.error("Setup password error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info(`You can continue using ${provider} to sign in`);
    router.push(callbackUrl || "/en/profile");
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading ? "Setting up..." : "Set Password"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSkip}
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}