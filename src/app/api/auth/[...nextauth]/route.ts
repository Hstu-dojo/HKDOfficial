import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "@/lib/hash";
import { findUserByEmail } from "@/lib/db/user";

export const authOptions: NextAuthOptions = {
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
          role: user.defaultRole as string,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      async profile(profile) {
        const user = await findUserByEmail(profile?.email);
        let about = "";
        if (user) {
          about = user.defaultRole;
        } else {
          about = "GUEST";
        }
        return {
          id: profile?.id,
          name: profile?.name,
          email: profile?.email,
          image: profile?.avatar_url,
          profile: profile?.bio,
          role: about || "GUEST",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout",
  },
  callbacks: {
    session: ({ session, token }) => {
      console.log("session callback", { session, token });
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
        },
      };
    },
    jwt: ({ token, user }) => {
      console.log("jwt callback", { token, user });
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
        };
      }

      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
