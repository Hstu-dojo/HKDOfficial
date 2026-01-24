"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
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
        setEmailChangeMessage('Syncing email to database...');
        
        fetch('/api/sync-email', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldEmail: oldEmail || null })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setEmailChangeMessage(`✅ Email updated successfully to ${data.email}! Database synced. Refreshing...`);
              localStorage.removeItem('email_change_old');
              setTimeout(() => window.location.reload(), 2000);
            } else {
              setEmailChangeError(`Database sync failed: ${data.error}`);
            }
          })
          .catch(err => {
            setEmailChangeError('Failed to sync email to database. Please contact support.');
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
  }, [searchParams]);

  // Handle hash fragment from email confirmation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('message=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashMessage = hashParams.get('message');
      
      if (hashMessage) {
        setEmailChangeMessage('Email confirmation received. Please check if your email has been updated.');
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        
        supabase.auth.getUser().then(({ data }) => {
          if (data.user && user && data.user.email !== user.email) {
            setEmailChangeMessage('Email updated successfully! Please refresh the page to see changes.');
          }
        });
      }
    }
  }, [user]);

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
        setEmailChangeMessage("Profile updated successfully!");
        setTimeout(() => setEmailChangeMessage(""), 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Please sign in to view your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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

      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      setEmailChangeMessage("Confirmation email sent! Please check your new email address.");
      setNewEmail("");
    } catch (error: any) {
      setEmailChangeError(error.message || "Failed to update email");
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
        setProfileUpdateMessage("No changes to save");
        setIsProfileUpdating(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setProfileUpdateMessage("Profile updated successfully!");
      setTimeout(() => setProfileUpdateMessage(""), 5000);
    } catch (error: any) {
      setProfileUpdateError(error.message || "Failed to update profile");
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
        throw new Error("Password must be at least 6 characters long");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (hasPassword) {
        if (!currentPassword) {
          throw new Error("Please enter your current password");
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });

        if (verifyError) {
          throw new Error("Current password is incorrect");
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
        hasPassword ? "Password changed successfully!" : "Password set successfully!"
      );
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      if (!hasPassword) {
        setHasPassword(true);
      }
      
      setTimeout(() => setPasswordChangeMessage(""), 5000);
    } catch (error: any) {
      setPasswordChangeError(error.message || "Failed to update password");
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";
  const emailVerified = user.email_confirmed_at ? true : false;
  const phoneVerified = user.phone_confirmed_at ? true : false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your profile and security settings</p>
          </div>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Membership</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Email</span>
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
                    <span>Member Since</span>
                  </div>
                  <p className="text-sm">{createdAt}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>Phone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{user.phone || "Not provided"}</p>
                    {phoneVerified && user.phone && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>User ID</span>
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
                      <span>Display Name</span>
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
              <CardTitle>Update Profile</CardTitle>
              <CardDescription>Update your display name and phone number</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code
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
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
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
              <CardTitle>{hasPassword ? "Change Password" : "Set Password"}</CardTitle>
              <CardDescription>
                {hasPassword 
                  ? "Update your password to keep your account secure" 
                  : "Set a password to enable email/password login"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingPassword ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading password settings...</span>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
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
                        {hasPassword ? "Changing..." : "Setting..."}
                      </>
                    ) : (
                      hasPassword ? "Change Password" : "Set Password"
                    )}
                  </Button>

                  {!hasPassword && (
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        You signed in with OAuth. Setting a password allows email/password login.
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
              <CardTitle>Change Email Address</CardTitle>
              <CardDescription>
                You will receive confirmation emails to verify the change
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-email">Current Email</Label>
                    <Input
                      id="current-email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
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
                      Sending...
                    </>
                  ) : (
                    "Change Email"
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
                Membership Details
              </CardTitle>
              <CardDescription>
                View and manage your dojo membership information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/onboarding?edit=true"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Edit Registration</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Update your member details</p>
                  </div>
                </Link>
                
                <Link 
                  href="/onboarding"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">View Registration</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">See your registration status</p>
                  </div>
                </Link>
              </div>

              <Separator />

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>
                  Your membership registration contains your personal details, emergency contacts, 
                  and other information required for dojo membership. You can edit these details 
                  at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link 
                  href="/dashboard/pay-fee"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                    <CurrencyBangladeshiIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Pay Fees</p>
                    <p className="text-xs text-slate-500">Make monthly payments</p>
                  </div>
                </Link>
                
                <Link 
                  href="/dashboard/enrollments"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Enrollments</p>
                    <p className="text-xs text-slate-500">View your courses</p>
                  </div>
                </Link>

                <Link 
                  href="/programs"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <TrophyIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Programs</p>
                    <p className="text-xs text-slate-500">Browse events & tests</p>
                  </div>
                </Link>

                <Link 
                  href="/courses"
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Courses</p>
                    <p className="text-xs text-slate-500">Explore training</p>
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
