"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, Calendar, Shield, Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // UI states
  const [isEmailChanging, setIsEmailChanging] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState("");
  const [profileUpdateMessage, setProfileUpdateMessage] = useState("");
  const [emailChangeError, setEmailChangeError] = useState("");
  const [profileUpdateError, setProfileUpdateError] = useState("");

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setPhone(user.phone || "");
    }
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
  }, [supabase.auth]);

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
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (error) throw error;

      setEmailChangeMessage(
        "Confirmation emails sent! Please check both your old and new email addresses to confirm the change."
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
