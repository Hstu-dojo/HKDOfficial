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
import avatarsData from "@/db/avatars.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useI18n } from "@/locales/client";
import { useCurrentLocale } from "@/locales/client";
import { Checkbox } from "@/components/ui/checkbox";

export function RegisterForm({ className, ...props }: UserAuthFormProps) {
  const searchParams = useSearchParams();
  //   console.log(searchParams?.get('callbackUrl'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUsername] = useState("");
  const [userAvatar, setAvatar] = useState("/image/avatar/Milo.svg");

  // Onboarding fields (merged)
  const [sex, setSex] = useState<string>("");
  const [nid, setNid] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [institute, setInstitute] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [agreement, setAgreement] = useState<boolean>(false);
  const [partners, setPartners] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  const router = useRouter();
  const t = useI18n();
  const locale = useCurrentLocale();

  const tenantBaseDomain =
    (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN as string | undefined) ||
    "p.hstuma.com";
  const isTenantHost = (() => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname.toLowerCase();
    const base = tenantBaseDomain.toLowerCase();
    return hostname.endsWith(`.${base}`) && hostname !== base && hostname !== `www.${base}`;
  })();

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

    // Onboarding required fields
    if (!phone || !dob || !partnerId || agreement !== true) {
      setIsLoading(false);
      return toast.error("Please complete onboarding details", {
        description: "Phone, Date of Birth, Training Venue, and agreement are required.",
      });
    }
    // console.log(email, password, userName, userAvatar);
    try {
      // Check if email or username already exists
      const checkResponse = await fetch('/api/auth/check-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userName })
      });
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        
        // Check for email duplication
        if (checkResult.emailExists) {
          toast.error("Email already registered", {
            description: "This email is already registered. Please login instead or use a different email.",
            action: {
              label: "Go to Login",
              onClick: () => router.push(`/${locale}/login`),
            },
          });
          setIsLoading(false);
          return;
        }
        
        // Check for username duplication
        if (checkResult.usernameExists) {
          toast.error("Username already taken", {
            description: "This username is already registered. Please choose a different username.",
          });
          setIsLoading(false);
          return;
        }
      }
      
      // Use backend endpoint so we can create both local user row + onboarding registration row.
      const response = await fetch('/api/auth/supabase-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          userName,
          userAvatar,
          sex: sex || null,
          nid: nid || null,
          occupation: occupation || null,
          institute: institute || null,
          faculty: faculty || null,
          address: address || null,
          phone,
          dob,
          partnerId,
          agreement,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = result?.error || "Registration failed";
        if (response.status === 409) {
          toast.error("Email/Username already registered", {
            description: msg,
            action: {
              label: "Go to Login",
              onClick: () => router.push(`/${locale}/login`),
            },
          });
        } else {
          toast.error(msg);
        }
        setIsLoading(false);
        return;
      }

      // Registration initiated successfully
      if (result?.user?.id) {
        toast.success("Registration Successful! 🎉", {
          description: "Please check your email to verify your account before signing in.",
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
        return router.push(`/${locale}/login`);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast("something went wrong", {
        description: "something went wrong, please try again later",
        action: {
          label: "Home",
          onClick: () => router.push(isTenantHost ? "/" : `/${locale}`),
        },
      });
    }
  };
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    // Set the avatars data when the component mounts
    setAvatars(avatarsData as any);
  }, []);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const response = await fetch('/api/partners');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setPartners(data);
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    }
    fetchPartners();
  }, []);

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="username">
              {t('auth.register.usernameLabel')}
            </Label>
            <Input
              className="border-green-500"
              id="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.register.usernamePlaceholder')}
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
              {t('auth.register.emailLabel')}
            </Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.register.emailPlaceholder')}
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
              {t('auth.register.passwordLabel')}
            </Label>
            <Input
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordLabel')}
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
                <SelectValue placeholder={t('auth.register.avatarLabel')} />
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

          {/* Onboarding Fields (Merged) */}
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="phone">
              Phone
            </Label>
            <Input
              id="phone"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              type="tel"
              autoComplete="tel"
              disabled={isLoading}
              required={true}
            />
          </div>

          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="dob">
              Date of Birth
            </Label>
            <Input
              id="dob"
              onChange={(e) => setDob(e.target.value)}
              type="date"
              autoComplete="bday"
              disabled={isLoading}
              required={true}
            />
          </div>

          <div className="grid gap-1">
            <Select onValueChange={(v) => setSex(v)} value={sex}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Input
              id="nid"
              onChange={(e) => setNid(e.target.value)}
              placeholder="NID / Birth Cert. / Passport No."
              type="text"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Input
              id="occupation"
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Occupation"
              type="text"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Input
              id="institute"
              onChange={(e) => setInstitute(e.target.value)}
              placeholder="Institute"
              type="text"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Input
              id="faculty"
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="Faculty / Section (Optional)"
              type="text"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Input
              id="address"
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Present Address"
              type="text"
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1">
            <Select onValueChange={(v) => setPartnerId(v)} value={partnerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Training Venue" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}{partner.location ? ` — ${partner.location}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox
              checked={agreement}
              onCheckedChange={(v) => setAgreement(v === true)}
              disabled={isLoading}
            />
            <div className="text-sm leading-snug text-muted-foreground">
              I agree to the terms and conditions.
            </div>
          </div>

          <Button disabled={isLoading}>
            {/* {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )} */}
            {t('auth.register.registerButton')}
          </Button>
        </div>
      </form>
      <SocialLoginButtons redirectTo="/profile" />
      <div className="flex-rol relative bottom-4 flex flex-wrap items-center justify-between">
        <small>
          {t('auth.register.existingMember')}{" "}
          <Link className="hover:underline" href="/login">
            {t('auth.register.loginLink')}
          </Link>
        </small>
      </div>
    </div>
  );
}
