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
import { FaGithub, FaGoogle } from "react-icons/fa6";

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
        toast(error.message || "something went wrong", {
          description: "something went wrong, please try again later",
          action: {
            label: "Login",
            onClick: () => router.push("/en/login"),
          },
        });
      } else if (data.user) {
        toast("Register Successful 🎉", {
          description: "Please check your email to verify your account before signing in. Didn't receive the email?",
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground dark:bg-slate-800">
            Or continue with
          </span>
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-full p-3"
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            try {
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback?next=/en/profile`
                }
              });
              
              if (error) {
                console.error('Google OAuth Error:', error);
                toast.error("Failed to sign in with Google");
                setIsLoading(false);
              } else {
                toast.success("Redirecting to Google...");
                // The redirect will happen automatically
              }
            } catch (error) {
              console.error('Google OAuth Error:', error);
              toast.error("Failed to sign in with Google");
              setIsLoading(false);
            }
          }}
        >
          <FaGoogle className="h-6 w-6" />
        </Button>
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-full p-3"
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            try {
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback?next=/en/profile`
                }
              });
              
              if (error) {
                console.error('GitHub OAuth Error:', error);
                toast.error("Failed to sign in with GitHub");
                setIsLoading(false);
              } else {
                toast.success("Redirecting to GitHub...");
                // The redirect will happen automatically
              }
            } catch (error) {
              console.error('GitHub OAuth Error:', error);
              toast.error("Failed to sign in with GitHub");
              setIsLoading(false);
            }
          }}
        >
          <FaGithub className="h-6 w-6" />
        </Button>
      </div>
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
