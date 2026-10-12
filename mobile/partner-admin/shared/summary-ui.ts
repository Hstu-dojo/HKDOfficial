import { attendanceMetrics } from "./attendance";
import type { Register } from "./types";
// Inject each platform's React renderer: web React 18 and native React 19 must not mix.
export function createAttendanceSummaryUI(
  createElement: (type: any, props: any, ...children: any[]) => any,
  views: { Grid: any; Metric: any },
) {
  return function AttendanceSummary({ sessions }: { sessions: Register[] }) {
    return createElement(
      views.Grid,
      null,
      ...attendanceMetrics(sessions).map((metric) =>
        createElement(views.Metric, { ...metric, key: metric.label }),
      ),
    );
  };
}
