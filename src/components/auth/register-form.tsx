"use client";

import { FormEvent, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}
import { toast } from "sonner";
import avatarsData from "@/db/avatars.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export function RegisterForm(
  { className, ...props }: UserAuthFormProps,
  { searchParams }: any,
) {
  //   console.log(searchParams?.callbackUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUsername] = useState("");
  const [userAvatar, setAvatar] = useState("Milo");
  const router = useRouter();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // check if all data is inputted
    if (!email || !password || !userName) {
      setIsLoading(false);
      return toast("All fields are required", {
        description: "all fields are required, please fill them out",
      });
    }
    console.log(email, password, userName, userAvatar);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userName, userAvatar }),
      });
      if (!response.ok) {
        toast(response?.statusText || "something went wrong", {
          description: "something went wrong, please try again later",
          action: {
            label: "Login",
            onClick: () => router.push("/login"),
          },
        });
      }
      //   return redirect("/auth/signin");
      setIsLoading(false);
      if (response.ok) {
        toast("Register Successful 🎉", {
          description: "Your account has been created successfully",
          action: {
            label: "Login",
            onClick: () => router.push("/login"),
          },
        });
        return router.push("/login");
      }
    } catch (error) {
      setIsLoading(false);
      toast("something went wrong", {
        description: "something went wrong, please try again later",
        action: {
          label: "Home",
          onClick: () => router.push("/"),
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
            <Select required={false}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="avatar" />
              </SelectTrigger>
              <SelectContent className="h-60 overflow-y-auto ">
                {avatars.map((avatar: any, index: any) => (
                  <SelectItem
                    key={avatar.name}
                    className=""
                    value={avatar.name}
                    onMouseDownCapture={() => setAvatar(avatar.name)}
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
