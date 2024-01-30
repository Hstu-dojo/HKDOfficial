"use client";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function AuthChecker(Component: any) {
  return function AuthChecker(props: any) {
    const { data: session } = useSession();
    useEffect(() => {
      if (!session) {
        redirect("/register");
      }
    }, [session]);
    if (!session) {
      return null;
    }
    return <Component {...props} />;
  };
}
