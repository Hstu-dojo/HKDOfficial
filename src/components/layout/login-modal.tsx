"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { cn } from "@/lib/utils";
import { BackgroundBeams } from "../ui/background-beams";

export default function LoginModal({ callbackUrl }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClosing, setIsClosing] = useState(false);

  const IsOpen = pathname?.includes("/login") && !isClosing;

  const handleLoginSuccess = () => {
    // Mark as closing to prevent re-render issues
    setIsClosing(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isClosing) {
      router.back();
    }
  };

  return (
    <Dialog open={IsOpen} onOpenChange={handleOpenChange}>
      <BackgroundBeams />
      <DialogContent className="w-full max-w-[400px] rounded-md">
        <DialogHeader>
          <DialogTitle>
            <h2 className=" font-semibold tracking-tight transition-colors">
              Welcome Back 👋
            </h2>
          </DialogTitle>
        </DialogHeader>
        <UserAuthForm 
          callbackUrl={callbackUrl?.toString()} 
          onLoginSuccess={handleLoginSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
