"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useCurrentLocale, useI18n } from "@/locales/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Check, 
  AlertCircle, 
  Loader2,
  KeyRound,
  Settings,
  FileText,
  ArrowLeft
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

function ProfileSettingsContent() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const intlLocale =
    currentLocale === "bn" ? "bn-BD" : currentLocale === "ne" ? "ne-NP" : "en-BD";

  const buildEmailChangeRedirectTo = () => {
    if (typeof window === 'undefined') return undefined;

    const host = window.location.hostname.toLowerCase();
    const isLocalhost = host.includes('localhost') || host.startsWith('127.');

    const tenantBaseDomain =
      (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN as string | undefined) ||
      'p.hstuma.com';

    const suffix = `.${tenantBaseDomain.toLowerCase()}`;
    const tenant = host.endsWith(suffix) ? host.slice(0, -suffix.length) : null;
    const safeTenant = tenant && /^[a-z0-9-]+$/.test(tenant) ? tenant : null;

    const pathname = window.location.pathname;
    const localeFromPath = pathname.split('/')[1] || '';
    const locale = /^[a-z]{2}(-[A-Z]{2})?$/.test(localeFromPath) ? localeFromPath : null;
    const nextPath = locale ? `/${locale}/dashboard/profile` : '/dashboard/profile';

    const rootDomain =
      (process.env.NEXT_PUBLIC_ROOT_DOMAIN as string | undefined) ||
      host.split('.').slice(-2).join('.');

    const callbackOrigin = isLocalhost
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) || `https://www.${rootDomain}`;

    const url = new URL('/auth/callback', callbackOrigin);
    if (safeTenant) url.searchParams.set('tenant', safeTenant);
    url.searchParams.set('next', nextPath);
    return url.toString();
  };

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [isEmailChanging, setIsEmailChanging] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState("");
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [emailChangeError, setEmailChangeError] = useState("");
  const [profileUpdateError, setProfileUpdateError] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  


  // Check if user has password (from identities)
  const [hasPassword, setHasPassword] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);

  // Check for URL parameters (success/error messages from email confirmation)
  useEffect(() => {
    if (!searchParams) return;
    
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    const shouldSyncEmail = searchParams.get('sync_email');
    
    if (message) {
      setEmailChangeMessage(message);
      
      if (shouldSyncEmail === 'true') {
        const oldEmail = localStorage.getItem('email_change_old');
        setEmailChangeMessage(t('profile.emailSyncing'));
        
        fetch('/api/sync-email', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldEmail: oldEmail || null })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setEmailChangeMessage(
                t('profile.emailSyncSuccess', { email: data.email }),
              );
              localStorage.removeItem('email_change_old');
              setTimeout(() => window.location.reload(), 2000);
            } else {
              setEmailChangeError(
                t('profile.emailSyncFailed', { error: data.error }),
              );
            }
          })
          .catch(err => {
            setEmailChangeError(t('profile.emailSyncNetworkError'));
          });
      }
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      newUrl.searchParams.delete('sync_email');
      window.history.replaceState({}, '', newUrl.toString());
      
      setTimeout(() => setEmailChangeMessage(""), 10000);
    }
    
    if (error) {
      setEmailChangeError(error);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
      setTimeout(() => setEmailChangeError(""), 5000);
    }
  }, [searchParams, t]);

  // Handle hash fragment from email confirmation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('message=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashMessage = hashParams.get('message');
      
      if (hashMessage) {
        setEmailChangeMessage(t('profile.emailConfirmationReceived'));
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        
        supabase.auth.getUser().then(({ data }) => {
          if (data.user && user && data.user.email !== user.email) {
            setEmailChangeMessage(t('profile.emailUpdatedRefresh'));
          }
        });
      }
    }
  }, [t, user]);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Check if user has a password
  useEffect(() => {
    const checkUserIdentities = async () => {
      if (!user) {
        setIsCheckingPassword(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUserIdentities();
        
        if (error) {
          setIsCheckingPassword(false);
          return;
        }

        const hasEmailIdentity = data?.identities?.some(
          (identity) => identity.provider === 'email'
        ) || false;
        
        setHasPassword(hasEmailIdentity);
      } catch (err) {
        console.error('Error checking identities:', err);
      } finally {
        setIsCheckingPassword(false);
      }
    };

    checkUserIdentities();
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_UPDATED') {
        setEmailChangeMessage(t('profile.profileUpdatedSuccessfully'));
        setTimeout(() => setEmailChangeMessage(""), 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, [t]);



  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('profile.accessDeniedTitle')}</CardTitle>
          <CardDescription>{t('profile.accessDeniedSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(`/${currentLocale}/login`)} className="w-full">
            {t('profile.signInButton')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${currentLocale}`);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailChanging(true);
    setEmailChangeError("");
    setEmailChangeMessage("");

    try {
      const currentEmail = user?.email;
      if (currentEmail) {
        localStorage.setItem('email_change_old', currentEmail);
      }

      const emailRedirectTo = buildEmailChangeRedirectTo();
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        emailRedirectTo ? { emailRedirectTo } : undefined
      );

      if (error) throw error;

      setEmailChangeMessage(t('profile.confirmationEmailSent'));
      setNewEmail("");
    } catch (error: any) {
      setEmailChangeError(error.message || t('profile.failedToUpdateEmail'));
    } finally {
      setIsEmailChanging(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileUpdating(true);
    setProfileUpdateError("");
    setProfileUpdateMessage("");

    try {
      const updates: any = {};
      
      if (name !== user.user_metadata?.name) {
        updates.data = { name };
      }
      
      if (phone && phone !== user.phone) {
        updates.phone = phone;
      }

      if (Object.keys(updates).length === 0) {
        setProfileUpdateMessage(t('profile.noChangesToSave'));
        setIsProfileUpdating(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setProfileUpdateMessage(t('profile.profileUpdatedSuccessfully'));
      setTimeout(() => setProfileUpdateMessage(""), 5000);
    } catch (error: any) {
      setProfileUpdateError(error.message || t('profile.failedToUpdateProfile'));
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordChanging(true);
    setPasswordChangeError("");
    setPasswordChangeMessage("");

    try {
      if (newPassword.length < 6) {
        throw new Error(t('profile.errors.passwordTooShort', { min: 6 }));
      }

      if (newPassword !== confirmPassword) {
        throw new Error(t('profile.errors.passwordsDoNotMatch'));
      }

      if (hasPassword) {
        if (!currentPassword) {
          throw new Error(t('profile.errors.currentPasswordRequired'));
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });

        if (verifyError) {
          throw new Error(t('profile.errors.currentPasswordIncorrect'));
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      if (!hasPassword) {
        try {
          await fetch('/api/auth/update-password-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              supabaseUserId: user.id,
              hasPassword: true 
            }),
          });
        } catch (dbError) {
          console.error('Error updating database:', dbError);
        }
      }

      setPasswordChangeMessage(
        hasPassword ? t('profile.passwordChangedSuccess') : t('profile.passwordSetSuccess'),
      );
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      if (!hasPassword) {
        setHasPassword(true);
      }
      
      setTimeout(() => setPasswordChangeMessage(""), 5000);
    } catch (error: any) {
      setPasswordChangeError(error.message || t('profile.failedToUpdatePassword'));
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(intlLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : t('profile.notAvailable');
  const emailVerified = user.email_confirmed_at ? true : false;
  const phoneVerified = user.phone_confirmed_at ? true : false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${currentLocale}/dashboard`} 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dashboardSidebar.accountSettings')}</h1>
            <p className="text-slate-600 dark:text-slate-400">{t('profile.accountSettingsSubtitle')}</p>
          </div>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          {t('header.signOut')}
        </Button>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('profile.tabs.account')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">{t('profile.tabs.security')}</span>
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('profile.tabs.membership')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.accountInformation')}
              </CardTitle>
              <CardDescription>{t('profile.accountDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{t('profile.email')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{user.email}</p>
                    {emailVerified ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{t('profile.createdAt')}</span>
                  </div>
                  <p className="text-sm">{createdAt}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{t('profile.phone')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{user.phone || t('profile.notProvided')}</p>
                    {phoneVerified && user.phone && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{t('profile.userId')}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-500">{user.id}</p>
                </div>
              </div>

              {user.user_metadata?.name && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{t('profile.displayName')}</span>
                    </div>
                    <p className="text-sm">{user.user_metadata.name}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Update Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.updateProfile')}</CardTitle>
              <CardDescription>{t('profile.updateProfileSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.displayNameLabel')}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('profile.displayNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('profile.phoneLabel')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('profile.includeCountryCode')}
                    </p>
                  </div>
                </div>

                {profileUpdateMessage && (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {profileUpdateMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {profileUpdateError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{profileUpdateError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isProfileUpdating}>
                  {isProfileUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.updating')}
                    </>
                  ) : (
                    t('profile.updateButton')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change/Set Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {hasPassword ? t('profile.changePasswordButton') : t('profile.setPasswordButton')}
              </CardTitle>
              <CardDescription>
                {hasPassword 
                  ? t('profile.passwordChangeSubtitle')
                  : t('profile.passwordSetSubtitle')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingPassword ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('profile.loadingPasswordSettings')}</span>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="current-password">{t('profile.currentPasswordLabel')}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('profile.currentPasswordPlaceholder')}
                        required
                      />
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t('profile.newPasswordLabel')}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('profile.newPasswordPlaceholder')}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('profile.minimumCharacters', { count: 6 })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t('profile.confirmPasswordLabel')}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('profile.confirmPasswordPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  {passwordChangeMessage && (
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {passwordChangeMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordChangeError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordChangeError}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={
                      isPasswordChanging || 
                      !newPassword || 
                      !confirmPassword ||
                      (hasPassword && !currentPassword)
                    }
                  >
                    {isPasswordChanging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {hasPassword ? t('profile.changingPassword') : t('profile.settingPassword')}
                      </>
                    ) : (
                      hasPassword ? t('profile.changePasswordButton') : t('profile.setPasswordButton')
                    )}
                  </Button>

                  {!hasPassword && (
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        {t('profile.oauthNote')}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Change Email Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.emailManagement')}</CardTitle>
              <CardDescription>
                {t('profile.emailChangeHint')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-email">{t('profile.currentEmail')}</Label>
                    <Input
                      id="current-email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-email">{t('profile.newEmailLabel')}</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t('profile.newEmailPlaceholder')}
                      required
                    />
                  </div>
                </div>

                {emailChangeMessage && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      {emailChangeMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {emailChangeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{emailChangeError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isEmailChanging || !newEmail}>
                  {isEmailChanging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.sending')}
                    </>
                  ) : (
                    t('profile.changeEmailButton')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('profile.membershipDetailsTitle')}
              </CardTitle>
              <CardDescription>
                {t('profile.membershipDetailsSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href={`/${currentLocale}/onboarding?edit=true`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.registration.editTitle')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.registration.editSubtitle')}</p>
                  </div>
                </Link>
                
                <Link 
                  href={`/${currentLocale}/onboarding`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.registration.viewTitle')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.registration.viewSubtitle')}</p>
                  </div>
                </Link>
              </div>

              <Separator />

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>{t('profile.membershipInfo')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.quickActionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link 
                  href={`/${currentLocale}/dashboard/enrollments`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                    <CurrencyBangladeshiIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.quickActions.payFeesTitle')}</p>
                    <p className="text-xs text-slate-500">{t('profile.quickActions.payFeesSubtitle')}</p>
                  </div>
                </Link>
                
                <Link 
                  href={`/${currentLocale}/dashboard/enrollments`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.quickActions.enrollmentsTitle')}</p>
                    <p className="text-xs text-slate-500">{t('profile.quickActions.enrollmentsSubtitle')}</p>
                  </div>
                </Link>

                <Link 
                  href={`/${currentLocale}/karate/programs`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <TrophyIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.quickActions.programsTitle')}</p>
                    <p className="text-xs text-slate-500">{t('profile.quickActions.programsSubtitle')}</p>
                  </div>
                </Link>

                <Link 
                  href={`/${currentLocale}/karate/courses`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.quickActions.coursesTitle')}</p>
                    <p className="text-xs text-slate-500">{t('profile.quickActions.coursesSubtitle')}</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Import icons used in quick links
import { 
  CurrencyBangladeshiIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

export default function DashboardProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProfileSettingsContent />
    </Suspense>
  );
}
