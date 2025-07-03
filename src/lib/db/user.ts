import { db } from "@/lib/connect-db";
import { user, provider, NewUser } from "@/db/schema";
import { eq } from "drizzle-orm";

type User = {
  email: string;
  password: string;
  userName: string;
  userAvatar: string;
};

export const createUser = async ({
  email,
  password,
  userName,
  userAvatar,
}: User) => {
  const result = await db.insert(user).values({
    email,
    password,
    userName,
    userAvatar,
  }).returning();
  
  return result[0];
};

export const getAllUsers = async () => {
  const users = await db.select().from(user);
  return users;
};

export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(user)
    .leftJoin(provider, eq(user.id, provider.userId))
    .where(eq(user.email, email));
  
  if (result.length === 0) return null;
  
  // Group providers by user
  const userData = result[0].user;
  const providers = result
    .filter(row => row.provider !== null)
    .map(row => row.provider!);
  
  return {
    ...userData,
    providers,
  };
};
