"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { PortableTextBlock } from "@portabletext/types";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CustomPortableText } from "@/components/blogs/shared/CustomPortableText";
import ImageBox from "../blogs/shared/ImageBox";
import { cn } from "@/lib/utils";

export const HoverEffect = ({
  items,
  className,
  data2,
}: {
  items: {
    title: string;
    description: string;
    link: string;
  }[];
  className?: string;
  data2: any;
}) => {
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleItems = data2?.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(data2.length / itemsPerPage);
    if (currentPage < maxPage) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const maxPage = Math.ceil(data2?.length / itemsPerPage);

  return (
    <div
      suppressHydrationWarning
      className="mt-5  rounded-xl border border-slate-300 p-3 "
    >
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3",
          className,
        )}
      >
        {visibleItems?.map((item: any, idx: any) => (
          <Link
            href={`/blog/post/${item?.slug}`}
            key={item?._id}
            className="group relative  block h-full w-full p-2"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 block h-full w-full rounded-3xl bg-neutral-200  dark:bg-slate-800/[0.8]"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <Card>
              <div className="w-full rounded-lg">
                <ImageBox
                  image={item?.coverImage}
                  alt={`Cover image from ${item?.title}`}
                  classesWrapper="relative aspect-[16/9]"
                />
              </div>
              <CardTitle>{item?.title}</CardTitle>
              <CardDescription>
                {isClient ? (
                  <CustomPortableText
                    value={item?.overview as PortableTextBlock[]}
                  />
                ) : (
                  "Rendering"
                )}
              </CardDescription>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-2 flex w-[100%] cursor-pointer justify-end">
        <Pagination>
          <PaginationContent className="font-thin">
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                className={currentPage === 1 ? "hidden" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                className={currentPage === maxPage ? "hidden" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      style={{ zIndex: 5 }}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 group-hover:border-slate-700 dark:border-white/[0.2]",
        className,
      )}
    >
      <div className="relative ">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("mt-4 font-bold tracking-wide text-zinc-700", className)}>
      {children}
    </h4>
  );
};
export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-8 text-sm leading-relaxed tracking-wide text-zinc-600",
        className,
      )}
    >
      {children}
    </p>
  );
};
