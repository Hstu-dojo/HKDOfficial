import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CustomPortableText } from "../../shared/CustomPortableText";
import type { SettingsPayload } from "../../../../../sanity/lib/sanity_types";
import GTranslate from "@/components/gTranslate";
export default function Footer({ data }: { data: SettingsPayload }) {
  return (
    <footer data-site-footer className="journal-footer">
      <div className="journal-container">
        <div className="journal-footer-top">
          <div>
            <span className="journal-kicker">Kaizen Karate Academy</span>
            <h2>
              Keep learning.
              <br />
              <em>Keep moving.</em>
            </h2>
            <p>Stories of practice, purpose, and progress.</p>
          </div>
          <div className="journal-footer-links">
            <Link href="/blog">
              The journal <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/">
              Visit the academy <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {!!data?.footer?.length && (
          <div className="journal-footer-copy">
            <CustomPortableText value={data.footer} />
          </div>
        )}
        <div className="journal-footer-bottom">
          <span>Kaizen Karate Academy · The Journal</span>
          <GTranslate />
        </div>
      </div>
    </footer>
  );
}
