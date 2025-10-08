"use client";
import { useSession } from "@/hooks/useSessionCompat";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { data: session, status } = useSession();
  const { signOut } = useAuth();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Temporarily show debug info instead of blocking access
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Debug: Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Status: {status}</p>
            <p className="mb-4">Session data:</p>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto mb-4">
              {JSON.stringify({ session, status }, null, 2)}
            </pre>
            <Button onClick={() => router.push('/login')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-semibold">Email:</label>
              <p>{session?.user?.email}</p>
            </div>
            
            <div>
              <label className="font-semibold">Name:</label>
              <p>{session?.user?.name}</p>
            </div>
            
            <div>
              <label className="font-semibold">Role:</label>
              <p>{session?.user?.role}</p>
            </div>
            
            <div>
              <label className="font-semibold">Email Verified:</label>
              <p>{session?.user?.emailVerified ? 'Yes' : 'No'}</p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({ session, status }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
