import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <h1>{JSON.stringify(session)}</h1>
    </div>
  );
}
