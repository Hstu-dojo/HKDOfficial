"use client";
import { useEffect, useState } from "react";
import type { PortableTextBlock } from "@portabletext/types";
import { CustomPortableText } from "../../shared/CustomPortableText";
import { SettingsPayload } from "../../../../../sanity/lib/sanity_types";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Button,
} from "@/components/ui/button";

interface FooterProps {
  data: SettingsPayload;
}

export default function Footer(props: FooterProps) {
  const { data } = props;
  const [isBottom, setIsBottom] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const footer = data?.footer || ([] as PortableTextBlock[]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight =
        "innerHeight" in window
          ? window.innerHeight
          : document.documentElement.offsetHeight;

      const body = document.body;
      const html = document.documentElement;
      const documentHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      );

      const windowBottom = windowHeight + window.pageYOffset;

      // Calculate the scroll position when the user is near the bottom of the page
      // (e.g., within the last 10% of the page)
      const triggerOffset = 0.9;
      const triggerScrollPosition = documentHeight * triggerOffset;

      if (windowBottom >= triggerScrollPosition) {
        setIsBottom(true);
      } else {
        setIsBottom(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const onFooterBottomReached = () => {
    // Trigger the opening of the drawer
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (isBottom) {
      // Trigger the provided callback when the bottom of the footer is reached
      onFooterBottomReached();
    }
  }, [isBottom]);

  return (
    <footer className="bottom-0 w-full bg-white py-12 text-center md:py-20">
      {footer && (
        <CustomPortableText
          paragraphClasses="text-md md:text-xl"
          value={footer}
        />
      )}
      <Drawer open={drawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            {/* <Button>Submit</Button> */}
            <DrawerClose>
              <Button onClick={() => { setDrawerOpen(false) }} variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </footer>
  );
}
