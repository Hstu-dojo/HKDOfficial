"use client";

import { FormEvent, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/supabase";
import avatarsData from "@/db/avatars.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

export function RegisterForm({ className, ...props }: UserAuthFormProps) {
  const searchParams = useSearchParams();
  //   console.log(searchParams?.get('callbackUrl'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUsername] = useState("");
  const [userAvatar, setAvatar] = useState("/image/avatar/Milo.svg");
  const router = useRouter();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // check if all data is inputted
    if (!email || !password || !userName || !userAvatar) {
      setIsLoading(false);
      return toast("All fields are required", {
        description: "all fields are required, please fill them out",
      });
    }
    // console.log(email, password, userName, userAvatar);
    try {
      // Check if email or username already exists
      const checkResponse = await fetch('/api/auth/check-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userName })
      });
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        
        // Check for email duplication
        if (checkResult.emailExists) {
          toast.error("Email already registered", {
            description: "This email is already registered. Please login instead or use a different email.",
            action: {
              label: "Go to Login",
              onClick: () => router.push("/en/login"),
            },
          });
          setIsLoading(false);
          return;
        }
        
        // Check for username duplication
        if (checkResult.usernameExists) {
          toast.error("Username already taken", {
            description: "This username is already registered. Please choose a different username.",
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Use Supabase client directly instead of API route
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userName,
            avatar_url: userAvatar,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error("Email already exists", {
            description: "This email is already registered. Please login instead.",
            action: {
              label: "Go to Login",
              onClick: () => router.push("/en/login"),
            },
          });
        } else {
          toast.error(error.message || "Registration failed", {
            description: error.message || "Something went wrong, please try again later",
          });
        }
        setIsLoading(false);
        return;
      }
      
      // Registration initiated successfully
      if (data.user) {
        // Log for debugging
        console.log('Signup response:', { 
          userId: data.user.id,
          email: data.user.email,
          hasIdentities: data.user.identities && data.user.identities.length > 0,
          hasSession: !!data.session
        });
        
        // Check if this is actually a duplicate (Supabase returns user but no identities)
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error("Email already registered", {
            description: "This email is already registered. Please login instead or check your email for the confirmation link.",
            action: {
              label: "Go to Login",
              onClick: () => router.push("/en/login"),
            },
          });
          setIsLoading(false);
          return;
        }
        
        toast.success("Registration Successful! 🎉", {
          description: "Please check your email to verify your account before signing in.",
          action: {
            label: "Resend Email",
            onClick: async () => {
              try {
                const resendResponse = await fetch("/api/auth/resend-confirmation", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ email }),
                });
                
                const resendResult = await resendResponse.json();
                
                if (resendResponse.ok) {
                  toast.success(resendResult.message);
                } else {
                  toast.error(resendResult.error || "Failed to resend email");
                }
              } catch (error) {
                toast.error("Failed to resend email");
              }
            },
          },
        });
        return router.push("/en/login");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast("something went wrong", {
        description: "something went wrong, please try again later",
        action: {
          label: "Home",
          onClick: () => router.push("/en"),
        },
      });
    }
  };
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    // Set the avatars data when the component mounts
    setAvatars(avatarsData as any);
  }, []);

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="username">
              Username
            </Label>
            <Input
              className="border-green-500"
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username (unique)"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email address"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
          </div>
          <div className="grid gap-1">
            <Select required={false} onValueChange={(e) => setAvatar(e)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="avatar" />
              </SelectTrigger>
              <SelectContent className="h-60 overflow-y-auto ">
                {avatars.map((avatar: any, index: any) => (
                  <SelectItem
                    key={avatar.name}
                    className=""
                    value={avatar.icon}
                  >
                    <div className="flex  flex-row items-center justify-between">
                      <Image
                        alt={avatar.name}
                        height={30}
                        width={30}
                        className="mr-2"
                        src={avatar.icon}
                        style={{
                          objectFit: "fill",
                        }}
                      />
                      <span>{avatar.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={isLoading}>
            {/* {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )} */}
            Register with Email
          </Button>
        </div>
      </form>
      <SocialLoginButtons redirectTo="/en/profile" />
      <div className="flex-rol relative bottom-4 flex flex-wrap items-center justify-between">
        <small>
          existing member?{" "}
          <Link className="hover:underline" href="/login">
            Login
          </Link>
        </small>
      </div>
    </div>
  );
}
