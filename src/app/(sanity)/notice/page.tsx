import { pageMetadata } from "@/lib/seo/site";
import { getNoticeBoard } from "@/lib/notices/server";
import NoticeBoard from "@/components/notices/NoticeBoard";
import { noticeLocale } from "@/lib/notices/copy";
import { noticePreview } from "@/lib/notices/model";
export const revalidate = 60;
export const metadata = pageMetadata({
  path: "/notice",
  title: "Academy & federation notice board",
  description:
    "Official notices from Kaizen Karate Academy and Bangladesh Karate Federation. Training updates, grading dates and competitions.",
});
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const data = await getNoticeBoard();
  return (
    <NoticeBoard
      locale={noticeLocale(lang)}
      data={{
        ...data,
        academy: {
          ...data.academy,
          items: data.academy.items.map(noticePreview),
        },
      }}
    />
  );
}
