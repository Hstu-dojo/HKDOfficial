"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EmailHistory from "./EmailHistory";
import BroadcastManager from "./BroadcastManager";
const tabStyle =
  "mb-0 w-auto flex-none rounded-md px-3 py-2 text-xs font-medium shadow-none data-[state=active]:bg-card data-[state=active]:before:hidden dark:data-[state=active]:bg-card sm:text-sm";
export default function EmailCenter() {
  return (
    <Tabs defaultValue="history" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1 sm:w-fit md:space-x-0">
        <TabsTrigger className={tabStyle} value="history">
          Email history
        </TabsTrigger>
        <TabsTrigger className={tabStyle} value="broadcasts">
          Newsletter broadcasts
        </TabsTrigger>
      </TabsList>
      <TabsContent value="history">
        <EmailHistory />
      </TabsContent>
      <TabsContent value="broadcasts">
        <BroadcastManager />
      </TabsContent>
    </Tabs>
  );
}
