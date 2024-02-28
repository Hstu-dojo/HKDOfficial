import type { PortableTextBlock } from "@portabletext/types";
import { CustomPortableText } from "../../shared/CustomPortableText";
import { SettingsPayload } from "../../../../../sanity/lib/sanity_types";

interface FooterProps {
  data: SettingsPayload;
}
export default function Footer(props: FooterProps) {
  const { data } = props;
  const footer = data?.footer || ([] as PortableTextBlock[]);
  return (
    <footer className="bottom-0 w-full bg-white py-12 text-center md:py-20">
      {footer && (
        <CustomPortableText
          paragraphClasses="text-md md:text-xl"
          value={footer}
        />
      )}
    </footer>
  );
}
