"use client";
import { useSession, signOut } from "next-auth/react";
import { SessionDebugger } from "@/components/debug/SessionDebugger";

export default function Profile() {
  const { data: session } = useSession();
  return (
    <div>
      <h1>{JSON.stringify(session)}</h1>
      <button onClick={() => signOut()}>Sign out</button>
      <SessionDebugger />
    </div>
  );
}
