import { TimelineItem } from "./TimelineItem";
import type { MilestoneItem } from "../../../../sanity/lib/sanity_types";

interface TimelineItem {
  title: string;
  milestones: MilestoneItem[];
}

export function TimelineSection({ timelines }: { timelines: TimelineItem[] }) {
  return (
    <div className="flex flex-col gap-4 pt-8 text-foreground md:flex-row">
      {timelines?.map((timeline, key) => {
        const { title, milestones } = timeline;
        return (
          <div className="w-full min-w-0 md:w-1/2" key={key}>
            <div className="pb-5 font-sans text-xl font-bold">{title}</div>

            {milestones?.map((experience, index) => (
              <div key={index}>
                <TimelineItem
                  milestone={experience}
                  isLast={milestones.length - 1 === index}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
