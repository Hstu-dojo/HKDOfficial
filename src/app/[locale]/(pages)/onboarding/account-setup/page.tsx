import { AccountOnboarding } from "@/components/component/account-onboarding";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AccountSet = () => {
  return (
    <div className="flex min-h-screen h-fit-content w-full items-center justify-center p-2">
      <Link href="/">
        <Button className="absolute right-4 top-4" variant="link">
          skip
        </Button>
      </Link>
      <AccountOnboarding />
    </div>
  );
};

export default AccountSet;
