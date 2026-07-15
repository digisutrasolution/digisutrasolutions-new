# DigiSutra CMS — Phase 3: Workflow & Collaboration

The editorial pipeline from the brief — Draft → Testing → SEO Review →
Admin Approval → Published — with comments, bug reports, notifications
and a hard publish gate.

## Pipeline

`Page.workflowStage` tracks the editorial pipeline, independent of
`Page.status` (public visibility). Rules live in `lib/cms/workflow.ts`:

| Action              | From → To            | Who            | Note      |
| ------------------- | -------------------- | -------------- | --------- |
| submit_for_testing  | DRAFT → TESTING      | pages.edit     |           |
| test_pass           | TESTING → SEO_REVIEW | testing.review |           |
| test_fail           | TESTING → DRAFT      | testing.review | required  |
| seo_approve         | SEO_REVIEW → APPROVAL| seo.manage     |           |
| seo_reject          | SEO_REVIEW → DRAFT   | seo.manage     | required  |
| approve             | APPROVAL → APPROVED  | pages.publish  |           |
| reject              | APPROVAL → DRAFT     | pages.publish  | required  |
| reopen              | APPROVED → DRAFT     | pages.edit     |           |

Every transition is stored (`WorkflowTransition`) with actor, note and
timestamp, shown as the stage-history timeline, and audit-logged.

**Integrity rules (verified):**
- Publishing or scheduling requires stage APPROVED; otherwise the API
  returns 409 `requiresApproval`. A Super Admin can pass `force: true`,
  which succeeds and records `forcedPastWorkflow` in the audit log.
- Any content edit on a page beyond DRAFT automatically returns it to
  DRAFT with an auto-transition ("Content edited — returned to draft"),
  so stale sign-offs can never ship.

## Comments & bug reports

- Comments: any panel role, threaded per page, stamped with the stage
  they were made at. `PageComment`.
- Bugs: filed by Tester/Super Admin with severity (LOW→CRITICAL) and an
  optional screenshot URL; resolved (RESOLVED / WONT_FIX) by developers
  or testers; reporter is notified on resolution. `BugReport`.
  (File-upload screenshots arrive with the Phase 4 media library.)

## Notifications

`lib/notify.ts` fans out in-app notifications (and email via Resend when
`RESEND_API_KEY` is set — silent no-op otherwise) to roles, always
excluding the actor:

| Event               | Notifies                    |
| ------------------- | --------------------------- |
| submit_for_testing  | Testers, Super Admins       |
| test_pass           | SEO Managers, Super Admins  |
| test_fail           | Developers, Super Admins    |
| seo_approve         | Super Admins                |
| seo_reject          | Developers, Super Admins    |
| approve / reject    | Developers (+SEO on approve)|
| comment added       | All panel roles             |
| bug filed           | Developers, Super Admins    |
| bug resolved        | The reporter                |

Bell in the admin topbar: unread badge, 60s poll, click-through marks
read and navigates; "mark all read".

## API additions

| Method | Path                        | Permission                     |
| ------ | --------------------------- | ------------------------------ |
| GET    | /api/pages/:id/workflow     | pages.view — stage, allowed actions, timeline, comments, bugs |
| POST   | /api/pages/:id/workflow     | per-action (table above) — `{action, note?}` |
| POST   | /api/pages/:id/comments     | pages.view — `{body}`          |
| POST   | /api/pages/:id/bugs         | testing.review — `{title, description, severity, screenshotUrl?}` |
| PATCH  | /api/bugs/:id               | testing.review or pages.edit — `{status}` |
| GET    | /api/notifications          | own items + unread count       |
| POST   | /api/notifications          | mark read — `{ids?}` (all if omitted) |

## UI

- Page editor → **Workflow tab**: stage stepper (completed stages
  checked), role-aware action buttons (rejections prompt for the
  mandatory note), comments thread, bug list with file/resolve, stage
  history timeline.
- Pages list and editor header show the stage chip beside the status.
- Dashboard: "Pages in testing", "Awaiting approval", "Open bugs" cards.

## Verified end-to-end

Developer created + submitted → Tester filed a HIGH bug + failed with
note → Developer commented, resolved the bug, resubmitted → Tester
passed → SEO approved → Admin approved → publish succeeded without
force. Separately: publish on a non-approved page returned 409, force
succeeded, developer publish returned 403, and the Super Admin inbox
collected all 7 expected notifications.
