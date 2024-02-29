"use client";
import { AccountOnboarding } from "@/components/component/account-onboarding";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

const AccountSet = ({ searchParams }: any) => {
  const [loadingVerify, setLoadingVerify] = useState(true);
  const callbackUrl = searchParams?.callbackUrl;
  const { data: session } = useSession();
  const router = useRouter();
  useLayoutEffect(() => {
    setLoadingVerify(true);
    try {
      //@ts-ignore
      if (session?.user?.emailVerified) {
        setLoadingVerify(false);
        router.push(callbackUrl || "/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingVerify(false);
    }
    //@ts-ignore
  }, [callbackUrl, router, session?.user?.emailVerified]);
  return (
    <div className="h-fit-content flex min-h-screen w-full items-center justify-center p-2">
      <Link href={`${callbackUrl || "/"}`}>
        <Button className="absolute right-4 top-4" variant="link">
          skip
        </Button>
      </Link>
      <AccountOnboarding
        loadingVerify={loadingVerify}
        callbackUrl={callbackUrl}
      />
    </div>
  );
};

export default AccountSet;
