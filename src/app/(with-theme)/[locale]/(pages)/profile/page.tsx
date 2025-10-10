"use client";
import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Phone, Calendar, Shield, Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
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
      
      // If sync_email flag is present, sync the email to local database
      if (shouldSyncEmail === 'true') {
        // Get the old email from localStorage (optional)
        const oldEmail = localStorage.getItem('email_change_old');
        console.log('Attempting to sync email. Old email from storage:', oldEmail || 'not found, will try other methods');
        
        setEmailChangeMessage('Syncing email to database...');
        
        fetch('/api/sync-email', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldEmail: oldEmail || null })
        })
          .then(res => res.json())
          .then(data => {
            console.log('Sync API response:', data);
            if (data.success) {
              setEmailChangeMessage(`✅ Email updated successfully to ${data.email}! Database synced via ${data.strategy}. Refreshing...`);
              // Clear the stored old email
              localStorage.removeItem('email_change_old');
              // Refresh the page to show new email
              setTimeout(() => window.location.reload(), 2000);
            } else {
              setEmailChangeError(`Database sync failed: ${data.error}`);
              console.error('Sync failed:', data.error, data.debug);
            }
          })
          .catch(err => {
            console.error('Failed to sync email:', err);
            setEmailChangeError('Failed to sync email to database. Please contact support.');
          });
      }
      
      // Clear URL params after showing message
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      newUrl.searchParams.delete('sync_email');
      window.history.replaceState({}, '', newUrl.toString());
      
      setTimeout(() => setEmailChangeMessage(""), 10000);
    }
    
    if (error) {
      setEmailChangeError(error);
      // Clear URL params after showing error
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
      
      setTimeout(() => setEmailChangeError(""), 5000);
    }
  }, [searchParams]);

  // TEMPORARY WORKAROUND: Handle hash fragment from default Supabase email template
  // This detects when user lands on page from email confirmation link
  useEffect(() => {
    // Check if there's a hash fragment with message
    const hash = window.location.hash;
    if (hash.includes('message=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashMessage = hashParams.get('message');
      
      if (hashMessage) {
        // This means user clicked email confirmation link
        // Show informational message
        setEmailChangeMessage(
          'Email confirmation received. Please check if your email has been updated. If not, please update the Supabase email template as described in EMAIL_CHANGE_SETUP_REQUIRED.md'
        );
        
        // Clean up hash
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
        
        // Try to refresh user session to get updated email
        supabase.auth.getUser().then(({ data }) => {
          if (data.user && user && data.user.email !== user.email) {
            // Email was actually updated! Show success
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

  // Check if user has a password by looking at their identities
  useEffect(() => {
    const checkUserIdentities = async () => {
      if (!user) {
        setIsCheckingPassword(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUserIdentities();
        
        if (error) {
          console.error('Error fetching identities:', error);
          setIsCheckingPassword(false);
          return;
        }

        // User has password if they have an 'email' identity
        const hasEmailIdentity = data?.identities?.some(
          (identity) => identity.provider === 'email'
        ) || false;
        
        setHasPassword(hasEmailIdentity);
        console.log('User identities:', data?.identities);
        console.log('Has password:', hasEmailIdentity);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'USER_UPDATED') {
        setEmailChangeMessage("Profile updated successfully!");
        setTimeout(() => setEmailChangeMessage(""), 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
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
      </div>
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
      // Store the current email BEFORE changing it
      const currentEmail = user?.email;
      if (currentEmail) {
        localStorage.setItem('email_change_old', currentEmail);
        console.log('Stored old email for sync:', currentEmail);
      }

      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (error) throw error;

      setEmailChangeMessage(
        "Confirmation email sent! Please check your new email address to confirm the change."
      );
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
      // Validation
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // For users with existing password, verify current password first
      if (hasPassword && currentPassword) {
        // Try to sign in with current password to verify it
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });

        if (verifyError) {
          throw new Error("Current password is incorrect");
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update local database to reflect user now has password
      if (!hasPassword) {
        try {
          const response = await fetch('/api/auth/update-password-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              supabaseUserId: user.id,
              hasPassword: true 
            }),
          });

          if (!response.ok) {
            console.error('Failed to update password status in database');
          }
        } catch (dbError) {
          console.error('Error updating database:', dbError);
          // Don't throw - password was updated successfully in Supabase
        }
      }

      setPasswordChangeMessage(
        hasPassword 
          ? "Password changed successfully!" 
          : "Password set successfully! You can now use it to sign in."
      );
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
      
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

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
                <p className="text-xs font-mono">{user.id}</p>
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
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              {profileUpdateMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
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

        {/* Change/Set Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>{hasPassword ? "Change Password" : "Set Password"}</CardTitle>
            <CardDescription>
              {hasPassword 
                ? "Update your password to keep your account secure" 
                : "Set a password to enable email/password login in addition to OAuth"
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
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {passwordChangeMessage && (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
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
                      {hasPassword ? "Changing password..." : "Setting password..."}
                    </>
                  ) : (
                    hasPassword ? "Change Password" : "Set Password"
                  )}
                </Button>

                {!hasPassword && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      You currently sign in with OAuth (Google/GitHub). Setting a password will allow you to also sign in using your email and password.
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
                  placeholder="Enter new email address"
                  required
                />
              </div>

              {emailChangeMessage && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
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
                    Sending confirmation emails...
                  </>
                ) : (
                  "Change Email"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
