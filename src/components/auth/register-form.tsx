"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}
import { toast } from "sonner";
export function RegisterForm(
  { className, ...props }: UserAuthFormProps,
  { searchParams }: any,
) {
  //   console.log(searchParams?.callbackUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        toast("something went wrong", {
          description: "something went wrong, please try again later",
          action: {
            label: "Home",
            onClick: () => router.push("/"),
          },
        });
      }
      console.log(response);

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
      console.error(error);
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

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
              placeholder="xxxxxxxxxxxxxxxxx"
              type="password"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
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
