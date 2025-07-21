import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Admin Panel",
  description: "Manage users, roles, and permissions",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
