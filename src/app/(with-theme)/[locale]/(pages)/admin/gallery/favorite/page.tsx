import { Tabs, TabsContent } from "@/components/ui/tabs";

import PreviewImages from "@/components/gallery/PreviewImages";

export default function MusicPage() {
  return (
    <Tabs defaultValue="music" className="space-y-6">
      <TabsContent value="music" className="border-none p-0 outline-none">
        <PreviewImages tag={"favorite"} />
      </TabsContent>
    </Tabs>
  );
}
