"use client";
import { useSession, signOut } from "next-auth/react";

export default function Profile() {
  const { data: session } = useSession();
  return (
    <div>
      <h1>{JSON.stringify(session)}</h1>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
