"use client";
import Link from "next/link";
import { resolveHref } from "../../../../../sanity/lib/utils";
import {
  MenuItem,
  SettingsPayload,
} from "../../../../../sanity/lib/sanity_types";
import { BiSolidMessageSquareEdit } from "react-icons/bi";
import { useSession } from "next-auth/react";
interface NavbarProps {
  data: SettingsPayload;
}
export default function Navbar(props: NavbarProps) {
  const { data } = props;
  const { data: session } = useSession();
  const menuItems = data?.menuItems || ([] as MenuItem[]);
  return (
    <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-x-5 bg-white/80 px-4 py-4 backdrop-blur md:px-16 md:py-5 lg:px-32">
      {menuItems &&
        menuItems.map((menuItem, key) => {
          const href = resolveHref(menuItem?._type, menuItem?.slug);
          if (!href) {
            return null;
          }
          return (
            <Link
              key={key}
              className={`text-lg hover:text-black md:text-xl ${
                menuItem?._type === "home"
                  ? "font-extrabold text-black"
                  : "text-gray-600"
              }`}
              href={href}
            >
              {menuItem.title}
            </Link>
          );
        })}
      <Link
        className={`justify-self-end text-lg font-semibold hover:text-black md:text-xl `}
        href={"/"}
      >
        Home
      </Link>
      {/* @ts-ignore */}
      {session?.user?.role ===( "ADMIN" || "MODERATOR" )&& (
        <Link
          className={`text-lg font-semibold hover:text-black md:text-xl `}
          href={"/studio"}
        >
          <BiSolidMessageSquareEdit />
        </Link>
      )}
    </div>
  );
}
