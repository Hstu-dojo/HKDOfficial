import { withAuth } from "next-auth/middleware";
export const withAuthMiddleware: any = withAuth({
  callbacks: {
    authorized: async ({ req, token }) => {
    //   console.log(token);
      if (req?.nextUrl?.pathname === "/docs") {
        return (token?.role as String) === "ADMIN";
      }
      return Boolean(token);
    },
  },
  // Options
  // If you need to add some options, you can do it here
});
