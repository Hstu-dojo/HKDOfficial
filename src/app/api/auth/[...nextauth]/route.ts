import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "@/lib/hash";
import { findUserByEmail } from "@/lib/db/user";
import { prisma } from "@/lib/connect-db";
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
        const user = await findUserByEmail(profile?.email);
        // console.log(user);
        let about = "";
        if (user) {
          about = user?.defaultRole as string;
          // if user is not verified, then verify the user
          if (user?.emailVerified === false) {
            await prisma?.user?.update({
              where: {
                id: user?.id,
              },
              data: {
                emailVerified: true,
              },
            });
            user.emailVerified = true;
          }

          // if the provider of github is not set, then set the provider
          if (
            user?.providers?.find((p) => p.provider === "GitHub") === undefined
          ) {
            await prisma?.provider?.create({
              data: {
                provider: "GitHub",
                providerAccountId: profile?.id.toString() as string,
                userId: user?.id as string,
                profile: profile as object | "not found" as object,
              },
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
          emailVerified: user?.emailVerified,
        };
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
            await prisma?.user?.update({
              where: {
                id: user?.id,
              },
              data: {
                emailVerified: true,
              },
            });
            user.emailVerified = true;
          }

          // if the provider of Google is not set, then set the provider
          if (
            user?.providers?.find((p) => p.provider === "Google") === undefined
          ) {
            await prisma?.provider?.create({
              data: {
                provider: "Google",
                providerAccountId: profile?.id.toString() as string,
                userId: user?.id as string,
                profile: profile as object | "not found" as object,
              },
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
          emailVerified: user?.emailVerified,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: ({ session, token }) => {
      // console.log("session callback", { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          image: token.image as string | null | undefined,
          profile: token.profile,
          role: token.role,
          emailVerified: token.emailVerified,
        },
      };
    },
    jwt: ({ token, user }) => {
      // console.log("jwt callback", { token, user });
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

      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
