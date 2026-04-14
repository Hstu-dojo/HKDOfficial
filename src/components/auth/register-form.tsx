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
import { useI18n } from "@/locales/client";
import { useCurrentLocale } from "@/locales/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

export function RegisterForm({ className, ...props }: UserAuthFormProps) {
  const searchParams = useSearchParams();
  //   console.log(searchParams?.get('callbackUrl'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const validateStep = (nextStep: number) => {
    if (nextStep <= 0) return true;

    // Step 0 (Account)
    if (!userName || !email || !password) {
      toast.error("Please complete account details", {
        description: "Username, email, and password are required.",
      });
      return false;
    }

    if (nextStep <= 1) return true;

    // Step 1 (Personal)
    if (!phone || !dob) {
      toast.error("Please complete personal details", {
        description: "Phone number and date of birth are required.",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    const next = Math.min(2, step + 1) as 0 | 1 | 2;
    if (!validateStep(next)) return;
    setStep(next);
  };

  const handlePrevStep = () => {
    setStep((s) => (Math.max(0, s - 1) as 0 | 1 | 2));
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Step {step + 1} of 3</p>
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", step >= 0 ? "bg-primary" : "bg-muted")} />
              <span className={cn("h-2 w-2 rounded-full", step >= 1 ? "bg-primary" : "bg-muted")} />
              <span className={cn("h-2 w-2 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
            </div>
          </div>

          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">{t('auth.register.usernameLabel')}</Label>
                <Input
                  className="border-green-500"
                  id="username"
                  value={userName}
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
              <div className="grid gap-2">
                <Label htmlFor="email">{t('auth.register.emailLabel')}</Label>
                <Input
                  id="email"
                  value={email}
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

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="password">{t('auth.register.passwordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.register.passwordLabel')}
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    disabled={isLoading}
                    required={true}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label>Avatar</Label>
                <Select required={false} value={userAvatar} onValueChange={(e) => setAvatar(e)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('auth.register.avatarLabel')} />
                  </SelectTrigger>
                  <SelectContent className="h-60 overflow-y-auto ">
                    {avatars.map((avatar: any) => (
                      <SelectItem key={avatar.name} value={avatar.icon}>
                        <div className="flex flex-row items-center justify-between">
                          <Image
                            alt={avatar.name}
                            height={30}
                            width={30}
                            className="mr-2"
                            src={avatar.icon}
                            style={{ objectFit: "fill" }}
                          />
                          <span>{avatar.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  type="tel"
                  autoComplete="tel"
                  disabled={isLoading}
                  required={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  type="date"
                  autoComplete="bday"
                  disabled={isLoading}
                  required={true}
                />
              </div>

              <div className="grid gap-2">
                <Label>Sex</Label>
                <Select onValueChange={(v) => setSex(v)} value={sex}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nid">ID Number (optional)</Label>
                <Input
                  id="nid"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="NID / Birth Cert. / Passport"
                  type="text"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="occupation">Occupation (optional)</Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Occupation"
                    type="text"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="institute">Institute (optional)</Label>
                  <Input
                    id="institute"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    placeholder="Institute"
                    type="text"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="faculty">Faculty / Section (optional)</Label>
                  <Input
                    id="faculty"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="Faculty / Section"
                    type="text"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Present Address (optional)</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Present Address"
                    type="text"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>Training Venue</Label>
                  <Select onValueChange={(v) => setPartnerId(v)} value={partnerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a venue" />
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
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isLoading || step === 0}
            >
              Back
            </Button>

            {step < 2 ? (
              <Button type="button" onClick={handleNextStep} disabled={isLoading}>
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => {
                  // keep submit UX consistent with the existing required field checks
                  if (!validateStep(2)) return;
                  if (!partnerId || agreement !== true) {
                    toast.error("Please complete onboarding details", {
                      description: "Training venue and agreement are required.",
                    });
                  }
                }}
              >
                {t('auth.register.registerButton')}
              </Button>
            )}
          </div>
        </div>
      </form>
      <div className="flex-rol relative bottom-4 flex flex-wrap items-center justify-between">
        <small>
          {t('auth.register.existingMember')}{" "}
          <Link className="hover:underline" href={`/${locale}/login`}>
            {t('auth.register.loginLink')}
          </Link>
        </small>
      </div>
    </div>
  );
}
