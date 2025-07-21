import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "@/lib/hash";
import { findUserByEmail } from "@/lib/db/user";
import { db } from "@/lib/connect-db";
import { user as userTable, provider as providerTable } from "@/db/schema";
import { eq } from "drizzle-orm";
// fix Property 'authOptions' is incompatible with index signature.
//fix Type error: Type 'OmitWithTag<typeof import("C:/Users/mrhas/Desktop/karate_dojo/src/app/api/auth/[...nextauth]/route"), "GET" | "POST" | "HEAD" | "OPTIONS" | "PUT" | "DELETE" | "PATCH" | "config" | "generateStaticParams" | ... 6 more ... | "maxDuration", "">' does not satisfy the constraint '{ [x: string]: never; }'.
interface UpdatedNextAuthOptions extends NextAuthOptions {}

export const authOptions: UpdatedNextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Sign In",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "paradoxtechbd@outlook.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await findUserByEmail(credentials.email);

        if (!user) {
          return null;
        }

        const matchPassword = await compare(
          credentials.password,
          user.password as string,
        );

        if (!matchPassword) {
          return null;
        }

        return {
          id: user.id + "",
          email: user.email,
          name: user.userName,
          image: user.userAvatar,
          profile: "hi there!",
          role: (user.defaultRole as string) || "GUEST",
          emailVerified: user.emailVerified,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      async profile(profile) {
        try {
          const user = await findUserByEmail(profile?.email);
          // console.log(user);
          let about = "";
          if (user) {
            about = user?.defaultRole as string;
            // if user is not verified, then verify the user
            if (user?.emailVerified === false) {
              await db.update(userTable).set({
                emailVerified: true,
              }).where(eq(userTable.id, user.id));
            }

            // if the provider of github is not set, then set the provider
            if (
              user?.providers?.find((p: any) => p.provider === "GitHub") === undefined
            ) {
              await db.insert(providerTable).values({
                provider: "GitHub",
                providerAccountId: profile?.id.toString() as string,
                userId: user?.id as string,
                profile: profile as object,
              });
            }
          } else {
            about = "GUEST";
          }
          return {
            id: user?.id || "0",
            name: profile?.name,
            email: profile?.email,
            image: profile?.avatar_url,
            profile: profile?.bio,
            role: about || "GUEST",
            emailVerified: user?.emailVerified || true,
          };
        } catch (error) {
          console.error("GitHub profile error:", error);
          return {
            id: "0",
            name: profile?.name,
            email: profile?.email,
            image: profile?.avatar_url,
            profile: profile?.bio,
            role: "GUEST",
            emailVerified: true,
          };
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      async profile(profile) {
        const user = await findUserByEmail(profile?.email);
        // console.log(user);
        let about = "";
        if (user) {
          about = user?.defaultRole as string;
          // if user is not verified, then verify the user
          if (user?.emailVerified === false) {
            await db.update(userTable).set({
              emailVerified: true,
            }).where(eq(userTable.id, user.id));
          }

          // if the provider of Google is not set, then set the provider
          if (
            user?.providers?.find((p: any) => p.provider === "Google") === undefined
          ) {
            await db.insert(providerTable).values({
              provider: "Google",
              providerAccountId: profile?.id.toString() as string,
              userId: user?.id as string,
              profile: profile as object,
            });
          }
        } else {
          about = "GUEST";
        }
        return {
          id: user?.id || "0",
          name: profile?.name,
          email: profile?.email,
          image: profile?.avatar_url,
          profile: profile?.bio,
          role: about || "GUEST",
          emailVerified: user?.emailVerified || true,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, token }) => {
      console.log("session callback", { session, token });
      
      // Ensure we always have the complete user data
      const completeUser = {
        id: token.id,
        email: token.email,
        name: token.name,
        image: token.image as string | null | undefined,
        profile: token.profile,
        role: token.role,
        emailVerified: token.emailVerified,
      };

      // If token is missing id but has email, try to get it from database
      if (!token.id && token.email) {
        try {
          const dbUser = await findUserByEmail(token.email);
          if (dbUser) {
            completeUser.id = dbUser.id;
            completeUser.role = dbUser.defaultRole;
            completeUser.emailVerified = dbUser.emailVerified;
          }
        } catch (error) {
          console.error("Error fetching user in session callback:", error);
        }
      }

      return {
        ...session,
        user: completeUser,
      };
    },
    jwt: async ({ token, user, account, profile, trigger }) => {
      console.log("jwt callback", { token, user, account, trigger });
      
      // On initial sign in, user object is available
      if (user) {
        const u = user as unknown as any;
        return {
          ...token,
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          profile: u.profile,
          role: u.role,
          emailVerified: u.emailVerified,
        };
      }

      // On subsequent calls, if token doesn't have id but has email, 
      // try to fetch user data from database
      if (!token.id && token.email) {
        try {
          const dbUser = await findUserByEmail(token.email);
          if (dbUser) {
            return {
              ...token,
              id: dbUser.id,
              role: dbUser.defaultRole,
              emailVerified: dbUser.emailVerified,
              profile: token.profile || "hi there!",
            };
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
