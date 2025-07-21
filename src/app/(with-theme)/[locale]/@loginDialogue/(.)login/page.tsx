import LoginModal from "@/components/layout/login-modal";
import {
  UserAuthForm,
  UserAuthFormProps,
} from "@/components/auth/user-auth-form";
interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function Login({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl;
  return <LoginModal callbackUrl={callbackUrl?.toString()} />;
}
