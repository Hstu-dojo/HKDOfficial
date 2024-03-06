"use client";
import { cn } from "@/lib/utils";
import React from "react";
import AvatarBox from "./AvatarBox";
import "./magazine.css";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageBox from "./ImageBox";
export function WallMagazine({
  avatar,
  trending,
}: {
  avatar: any;
  trending: any;
}) {
  // console.log(trending);
  const items = [
    {
      title: "Meet the Writers",
      description: (
        <span className="text-sm">
          Experience the power of writing power from our experienced writers.
        </span>
      ),
      header: <SkeletonOne avatar={avatar} />,
      className: "md:col-span-1 group ",
      icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Know about HKD",
      description: (
        <span className="text-sm">
          HKD Dojo is currently only and official Dojo at HSTU.
        </span>
      ),
      header: <SkeletonTwo />,
      className: "md:col-span-1",
      icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Training Posts",
      description: (
        <span className="text-sm">
          Get regular posts about training and tutorials as blog posts.
        </span>
      ),
      header: <SkeletonThree />,
      className: "md:col-span-1",
      icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "Trending Posts",
      description: (
        <span className="text-sm">
          Have a look at the trending posts from our blog.
        </span>
      ),
      header: <SkeletonFour trending={trending} />,
      className: "md:col-span-2",
      icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
    },

    {
      title: "Live Support",
      description: (
        <span className="text-sm">
          We are available 24/7 to support you on time.
        </span>
      ),
      header: <SkeletonFive />,
      className: "md:col-span-1",
      icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
    },
  ];
  return (
    <BentoGrid className="mx-auto max-w-4xl md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}
const Skeleton = () => (
  <div className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[6rem] w-full   flex-1 rounded-xl border  border-transparent bg-neutral-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:border-white/[0.2] dark:bg-black"></div>
);

const SkeletonOne = ({ avatar }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const variants = {
    initial: {
      x: 0,
      y: 0,
    },
    animate: {
      x: -10,
      y: "-100%", // Scroll down to 100%
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };

  const variantsSecond = {
    initial: {
      x: 0,
      y: 0,
    },
    animate: {
      x: 10,
      y: "-100%", // Scroll down to 100%
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener("mouseenter", () => {
        containerRef.current?.classList.add("scrolling");
      });

      containerRef.current.addEventListener("mouseleave", () => {
        containerRef.current?.classList.remove("scrolling");
      });
    }
  }, []);

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] scrollbar-hide flex h-[280px] min-h-[6rem] w-full flex-1 flex-col space-y-2 overflow-y-scroll"
      ref={containerRef}
    >
      {avatar?.slice(0, 4)?.map((item: any, i: number) => (
        <motion.div
          key={i}
          variants={i % 2 === 0 ? variants : variantsSecond}
          className={
            `flex items-center gap-2 rounded-full border border-neutral-100 bg-white p-2 dark:border-white/[0.2] dark:bg-black ` +
            `${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`
          }
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-tertiary">
            <AvatarBox image={item?.image} />
          </div>
          <div className="h-7 w-full overflow-hidden rounded-full bg-gray-100 text-center text-[19px] text-gray-600">
            {item?.name?.slice(0, 15)}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
const SkeletonTwo = () => {
  const words = `HSTU Karate Dojo is a karate club that is situated at Hajee Mohammad Dahesh Science & Technology University, Dinajpur-5200. The dojo began its journey in 2022. Now, it is the official club at this university. At present, the dojo is active.
`;
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(6).fill(0);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 text-justify text-sm text-gray-500"
    >
      {/* {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxWidth: Math.random() * (100 - 40) + 40 + "%",
          }}
          className="flex h-4 w-full flex-row items-center space-x-2 rounded-full  border border-neutral-100 bg-neutral-100 p-2 dark:border-white/[0.2] dark:bg-black"
        ></motion.div>
      ))} */}
      <TextGenerateEffect words={words} />
    </motion.div>
  );
};
const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 rounded-lg"
      style={{
        background:
          "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="h-full w-full rounded-lg">
        <Image
          className="h-full w-full rounded-lg object-cover"
          src="/image/kick.gif"
          width={400}
          height={300}
          alt="kick gif"
        />
      </motion.div>
    </motion.div>
  );
};
const SkeletonFour = ({ trending }: any) => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const router = useRouter();
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[7rem] w-full flex-1 flex-row space-x-2"
    >
      {/* first card  */}
      {trending?.slice(0, 2)?.map((item: any, i: number) => (
        <motion.div
          key={i}
          variants={i % 2 === 0 ? first : i === 1 ? undefined : second}
          className={`flex h-full w-1/3 cursor-pointer flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-black`}
          style={{ zIndex: i === 1 ? 3 : 1 }}
          onClick={() => router.push(`/blog/post/${item?.slug}`)}
        >
          <motion.div className="h-full w-full rounded-lg">
            <ImageBox
              alt="avatar"
              image={item?.coverImage}
              classesWrapper="h-full w-full rounded-lg object-cover relative aspect-[16/9]"
            />
          </motion.div>
          <p className="text-center text-xs font-semibold text-neutral-500 sm:text-sm">
            {item?.title.slice(0, 30)}..
          </p>
          <p className="mt-1 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/20">
            {(item?.author?.name).slice(0, 15)}..
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
};
const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-start space-x-2 rounded-2xl border border-neutral-100  bg-white p-2 dark:border-white/[0.2] dark:bg-black"
      >
        <Image
          src="/logo.png"
          alt="avatar"
          height="100"
          width="100"
          className="h-10 w-10 rounded-full"
        />
        <p className="text-xs text-neutral-500">
          You can join us today and start earing a valuable belt within
          4months....
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="ml-auto flex w-3/4 flex-row items-center justify-end space-x-2 rounded-full border border-neutral-100 bg-white p-2 dark:border-white/[0.2] dark:bg-black"
      >
        <p className="text-xs text-neutral-500">Thanks, see ya</p>
        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
      </motion.div>
    </motion.div>
  );
};
