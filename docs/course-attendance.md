Course attendance
=================

Partner portal: `/partner-admin/portal/attendance`. Main administration: `/[locale]/admin/attendance`.

Choose a course, training date (Bangladesh time) and session name. Different session names allow morning/evening registers on the same date. Every active student must receive an explicit present, absent, late or excused mark before saving. Notes can be attached to each student and the session. A saved register can be reopened and corrected. Monthly totals, student rates and a CSV download use saved registers only. Late is attended; excused is excluded from rate calculations.

Eligibility requires an active profile owned by the course's branch, an active enrollment which has started, and no inactive override for the selected month. Pending applicants and other branches are excluded. Inactive courses retain readable history but cannot receive edits. Historical student entries are retained if the student becomes inactive; those entries cannot be re-marked. Historical eligibility before a profile/enrollment was deactivated cannot be reconstructed from the current active flags, so backdated new marks require the student to still be active.

The server derives organization ownership and student names/member numbers. It rejects injected students, duplicate records, future dates, and stale concurrent updates. Session uniqueness is course/date/session name. Transaction locks serialize course register writes. `recorded_by` identifies the last saving main admin or partner admin. Registers snapshot names/numbers to preserve readable history.

Main admin requires `ADMIN_PANEL:ACCESS` and `ATTENDANCE:READ`. Recording additionally requires `ATTENDANCE:UPDATE` (or `MANAGE`). ADMIN/SUPER_ADMIN receive the new resource by migration; other roles can be granted view/edit separately through RBAC. Partner admins are scoped to their authenticated organization. Neither member nor gallery permissions grant access.

Run `pnpm run db:migrate:attendance` before deployment. The idempotent script commits the PostgreSQL enum addition before creating permissions. This course register uses its own table and leaves the older class-based attendance system intact. `pnpm run test:attendance` verifies validation, scoping, permission separation, concurrent edits and historical preservation.
