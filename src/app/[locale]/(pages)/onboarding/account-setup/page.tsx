import { AccountOnboarding } from "@/components/component/account-onboarding";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AccountSet = ({ searchParams }: any) => {
  const callbackUrl = searchParams?.callbackUrl;
  return (
    <div className="flex min-h-screen h-fit-content w-full items-center justify-center p-2">
      <Link href="/">
        <Button className="absolute right-4 top-4" variant="link">
          skip
        </Button>
      </Link>
      <AccountOnboarding callbackUrl={callbackUrl} />
    </div>
  );
};

export default AccountSet;
