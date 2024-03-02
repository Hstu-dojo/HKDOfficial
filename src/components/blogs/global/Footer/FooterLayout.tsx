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
import { Button } from "@/components/ui/button";
import SocialShare from "@/components/ui/socialShare";
import GTranslate from "@/components/gTranslate";

interface FooterProps {
  data: SettingsPayload;
}

export default function Footer(props: FooterProps) {
  const { data } = props;
  const [isBottom, setIsBottom] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrollThreshold, setScrollThreshold] = useState(0);
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

      const triggerOffset = 0.1; // You can adjust this threshold value
      const triggerScrollPosition = documentHeight * (1 - triggerOffset);

      if (windowBottom >= triggerScrollPosition) {
        setIsBottom(true);
        setScrollThreshold(windowBottom - triggerScrollPosition);
      } else {
        setIsBottom(false);
        setScrollThreshold(0);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const onFooterBottomReached = () => {
    // Open the drawer only when the user scrolls further down after reaching the bottom
    if (isBottom && scrollThreshold > 0) {
      setDrawerOpen(true);
    }
  };

  useEffect(() => {
    if (isBottom) {
      // Trigger the provided callback when the bottom of the footer is reached
      onFooterBottomReached();
    }
    //@ts-ignore
  }, [isBottom, scrollThreshold]);

  // const handleCancelClick = () => {
  //   // Scroll to the top of the page
  //   window.scrollTo({ top: 0, behavior: "auto" }); // Use "auto" for instant scroll
  //   setDrawerOpen(false);
  // };

  return (
    <footer className="bottom-0 w-full bg-white py-12 text-center md:py-20">
      {footer && (
        <CustomPortableText
          paragraphClasses="text-md md:text-xl"
          value={footer}
        />
      )}
      <div className="flex w-full flex-row flex-wrap items-center justify-center">
        <GTranslate />
      </div>

      <Drawer open={drawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Might be helpful for someone?</DrawerTitle>
            <DrawerDescription className="flex w-full justify-center">
              <SocialShare />
            </DrawerDescription>
          </DrawerHeader>
          {/* <DrawerFooter>
            <DrawerClose>
              <Button onClick={handleCancelClick} variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter> */}
        </DrawerContent>
      </Drawer>
    </footer>
  );
}
