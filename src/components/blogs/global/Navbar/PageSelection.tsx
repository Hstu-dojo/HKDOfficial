"use client"

import * as React from "react"
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { resolveHref } from "../../../../../sanity/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Status = {
  value: string
  label: string
}

// const statuses: Status[] = [
//   {
//     value: "backlog",
//     label: "Backlog",
//   },
//   {
//     value: "todo",
//     label: "Todo",
//   },
//   {
//     value: "in progress",
//     label: "In Progress",
//   },
//   {
//     value: "done",
//     label: "Done",
//   },
//   {
//     value: "canceled",
//     label: "Canceled",
//   },
// ]

export default function PageSelection({ menuItems }:any) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(
    null,
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start">
            {selectedStatus ? <>{selectedStatus.label}</> : <> Explore</>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <StatusList menuItems={menuItems} setOpen={setOpen} setSelectedStatus={setSelectedStatus} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className=" justify-start">
          {selectedStatus ? <>{selectedStatus.label}</> : <> Explore</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <StatusList menuItems={menuItems} setOpen={setOpen} setSelectedStatus={setSelectedStatus} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StatusList({
  setOpen,
  setSelectedStatus,
  menuItems
}: {
  setOpen: (open: boolean) => void
  setSelectedStatus: (status: Status | null) => void
  menuItems: any
}) {
  const router = useRouter();
  return (
    <Command>
      <CommandInput placeholder="Filter status..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {menuItems.map(
            function(status: any){
            const href = resolveHref(status?._type, status?.slug);
            if (!href) {
              return null;
            }
            return (
              <CommandItem
                key={status.title}
                value={status.title}
                onSelect={(value) => {
                  // setSelectedStatus(
                  //   menuItems.find((priority: any) => priority.title === value) || null,
                  // );
                  router.push(`/blog/${href}`);
                  // console.log(href)
                  setOpen(false);
                }}
              >
                {status.title}
              </CommandItem>
            );
        })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
