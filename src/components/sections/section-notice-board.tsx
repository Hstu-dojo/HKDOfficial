"use client";
import { useCurrentLocale } from "@/locales/client";
import NoticeBoard, {
  type NoticeBoardData,
} from "@/components/notices/NoticeBoard";
import { noticeLocale } from "@/lib/notices/copy";
export default function SectionNoticeBoard({
  data,
}: {
  data: NoticeBoardData;
}) {
  return (
    <NoticeBoard
      data={data}
      locale={noticeLocale(useCurrentLocale())}
      compact
    />
  );
}
