import dynamic from "next/dynamic";
import { draftMode } from "next/headers";

import FooterLayout from "./FooterLayout";
import { loadSettings } from "../../../../../sanity/loader/loadQuery";
const FooterPreview = dynamic(() => import("./FooterPreview"));

export async function Footer() {
  const initial = await loadSettings();

  if (draftMode().isEnabled) {
    return <FooterPreview initial={initial} />;
  }

  return <FooterLayout data={initial.data} />;
}
