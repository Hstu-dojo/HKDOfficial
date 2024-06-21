import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PreviewImages from "@/components/gallery/PreviewImages";

export default function MusicPage() {
  return (
    <>
      <div className="col-span-3 lg:col-span-4 lg:border-l">
        <div className="h-full px-4 py-6 lg:px-8">
          <Tabs defaultValue="music" className="h-full space-y-6">
            <div className="space-between flex items-center"></div>
            <TabsContent value="music" className="border-none p-0 outline-none">
              <PreviewImages tag={"favorite"} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
