"use client"
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
// import { CustomPortableText } from '@/components/blogs/shared/CustomPortableText'
export const HoverEffect = ({
  items,
  className,
  data2
}: {
  items: {
    title: string;
    description: string;
    link: string;
  }[];
  className?: string;
  data2: any;
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
   const [isClient, setIsClient] = useState(false)
 
  useEffect(() => {
    setIsClient(true)
  }, [])
    console.log(data2)
  return (
    <div suppressHydrationWarning className="mt-5  rounded-xl border border-slate-300 p-3 ">
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3",
          className,
        )}
      >
        {data2?.map((item:any, idx:any) => (
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
              <CardTitle>{item?.title}</CardTitle>
              {/* <CardDescription>{isClient ? <CustomPortableText value={item?.overview as any} /> : 'Rendering'}</CardDescription> */}
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-2 flex w-[100%] justify-end">
        <Pagination>
          <PaginationContent className="font-thin">
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
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
