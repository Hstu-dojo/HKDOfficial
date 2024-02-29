import LoginModal from "@/components/layout/login-modal";
import {
  UserAuthForm,
  UserAuthFormProps,
} from "@/components/auth/user-auth-form";
interface ExtendedUserAuthFormProps extends UserAuthFormProps {
  callbackUrl: string;
}
export default async function Login({ searchParams }: any) {
  const callbackUrl = searchParams?.callbackUrl as ExtendedUserAuthFormProps;
  return <LoginModal callbackUrl={callbackUrl?.toString()} />;
}
