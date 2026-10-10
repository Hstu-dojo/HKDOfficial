import Link from "next/link";
import Image from "next/image";
import type { SettingsPayload } from "../../../../../sanity/lib/sanity_types";
import PageSelection from "./PageSelection";
import { DarkModeSwitch } from "@/components/dark-mode-switch";
export default function Navbar({ data }: { data: SettingsPayload }) {
  return (
    <header className="journal-nav">
      <nav
        className="journal-container journal-nav-inner"
        aria-label="Journal navigation"
      >
        <Link
          href="/"
          className="journal-logo"
          aria-label="Kaizen Karate Academy home"
        >
          <Image
            src="/logo.svg"
            alt="Kaizen Karate Academy"
            width={160}
            height={50}
            priority
          />
        </Link>
        <Link href="/blog" className="journal-wordmark">
          The Kaizen <em>Journal</em>
        </Link>
        <div className="journal-nav-actions">
          <DarkModeSwitch />
          <PageSelection menuItems={data?.menuItems || []} />
        </div>
      </nav>
    </header>
  );
}
