# Feature coverage — updated October 21, 2026

**This is not complete production parity with BetterCampus 9.8.15.** Implemented features have no paywalls. The repository analyzed with REA is version 5.12.6; current additional requirements come from the public website/store. Original source/assets have not been copied into this implementation.

| Public feature | CourseLark implementation | Status / boundary |
| --- | --- | --- |
| Dark mode, custom colors | Original palettes, editable theme colors | Implemented; representative Canvas fixture tested, institution layouts unverified |
| Schedule/device dark mode | Time windows and system preference | Implemented and tested |
| Themes, builder, remixes | Five original presets; unlimited local themes/remixes; JSON import/export | Implemented with public BetterCampus community browsing/search/pagination/import and native/BetterCampus JSON exchange; conversion limits are shown before installation |
| Auto-rotate and history | Daily rotation; unrestricted local history | Implemented; daily rotation does not add history snapshots |
| Image editor | Per-card HTTPS background, brightness, blur | Implemented; no crop/advanced bitmap editor |
| Community themes, reactions, submissions | Public BetterCampus catalog and theme-file exchange | Browsing/import implemented; publishing, likes/comments/review not implemented |
| Fonts, gradients, density/sidebar controls | Five installed font families; gradients, compact cards, hide logo/feedback, show links/grades | Google Fonts families, layered gradients/HTTPS sidebar images and user custom CSS and custom tab icons (emoji or HTTPS image) implemented |
| Course customization | Colors/images/names/codes/visibility/custom links; existing Canvas images preserved unless overridden | Implemented; fixture verifies injection/restoration |
| Assignment list/deadlines | Canvas paginated same-origin API import, search/filter, completion; inline Canvas right sidebar with timeframe, groups, progress and local add task | Implemented and synthetic integration tested; one-time site enable, then automatic refresh on each visit (30-minute throttle) |
| Dashboard assignment preview | Text-only descriptions in workspace and injected Canvas cards | Implemented; recent Canvas announcements (21 days, plain text) preview on the workspace dashboard |
| Subtasks, notes, work times | Per-task local controls, agenda grouping | Implemented, persistence tested |
| Todo progress visuals | In-page progress ring, grouped cards, completed tab, course colors and task count | Implemented in fixture; original browser installation was unavailable for live post-change visual verification |
| Assignment reminders | Browser alarms, deduplicated notifications, configurable lead | Implemented with mock extension tests; OS notification behavior unverified |
| Plan/calendar sync | Work blocks, ICS export, Google/Outlook event links; one-way sync into a CourseLark calendar on Google (OAuth token flow), Outlook (OAuth PKCE) and iCloud (CalDAV with app-specific password), every 5 minutes, direct from the browser | Implemented with mocked provider tests. Google/Outlook need public OAuth client IDs in `src/calendar-config.js`; real-account sync unverified. Changes made inside the provider calendar are not pulled back. |
| Credit-weighted GPA | Current and cumulative in-page overview; configurable whole-letter or plus/minus scale, credits, course exclusions, prior GPA and term choice; standalone grade planner | Implemented and tested, including a custom percentage-to-points scale editor in the Canvas GPA settings |
| Individual grade goals | Per-course goals and final-score requirement | Implemented and tested |
| Assignment what-if | Hypothetical points-based grades | Implemented; Canvas assignment-group weights, drop-lowest/highest and never-drop rules are imported and applied (percentage-based drop choice) |
| Grade trends | Local score snapshots with bar chart | Implemented; no historical server data |
| Notes by class/task | Class notebooks, task notes, dashboard excerpts | Implemented, persistence tested |
| Notes/files uploads | Text/MD/CSV/JSON, searchable PDF, DOCX, PPTX text extraction | Implemented; scanned PDFs can be read with local Tesseract through the companion (OCR adds text to the notebook); full slide visuals not included |
| PDF annotation | Pen colors/sizes, page ink stored locally, annotated-page PNG export | Implemented; annotated page PNG and whole-document annotated PDF export (pages flattened to images, so text is not selectable) |
| Audio notes/history | Local microphone recording, playback, separate audio exports | Implemented; real microphone/device behavior unverified |
| Live transcription | Browser speech recognition when supported | Optional; vendor service may be used, support varies |
| Offline transcription | Local ffmpeg → whisper.cpp adapter | Engine/model required; real transcription unverified |
| Smart notes, file chat | Loopback companion forwards notebook context to configured Ollama, which may use a cloud model | Implemented adapter; real model generation unverified |
| AI study-set generation | Requested count/difficulty, validated JSON cards, edit before use | Implemented adapter; model-dependent accuracy and limits |
| Flashcards/quizzes/study sets | Unlimited local sets, flipping, multiple-choice practice with correct definition | Implemented and browser tested; explanation is the source definition |
| Match | Term-definition pairing; time penalty for wrong pairs | Original game implemented |
| Blocks | Earn blocks through questions; fill rows/columns to score | Original single-cell block game implemented; not an identical puzzle engine |
| Blast | Click falling definition asteroids; correct hits score, wrong hits cost time | Original game implemented |
| Charms | Adjacent swaps, match-three cascades, question-gated additional moves | Original game implemented |
| High scores | Stored per set/game | Implemented locally |
| Companion/streaks/levels | Original Sprout character with XP and daily activity streak | Implemented locally; not Campy artwork/animations |
| Friends/community/public materials | No remote social backend | Not implemented |
| Cross-device account sync | JSON backups and separate attachments | Settings, appearance, custom CSS and themes sync through the browser's own account sync (opt-in, no CourseLark server); tasks/notes/grades stay per device; no CourseLark accounts |
| Custom playlists | User-supplied provider URL | Saved link plus on-request in-app embedded player for Spotify, YouTube and Apple Music; provider account features depend on the provider |
| Custom focus/break timers | Deadline-based local timer, pause/reset, notifications | Implemented; browser/workspace must remain open |
| Breathing breaks | Adjustable duration, inhale/exhale animation | Implemented |
| Agenda/motivational quotes | All upcoming work/due dates; editable quote | Implemented |
| Canvas | Authenticated read-only import and inline GPA/to-do enhancements | Implemented; updated extension loaded on the user's live Canvas page in Brave; official import and GPA accuracy still depend on Canvas data and school policy |
| Workspace panel in Canvas | Full workspace opens in an embedded modal from Canvas navigation or the toolbar popup; grade planner opens the GPA page in the same tab | Tested in isolated Chromium and in the user's live Brave Canvas tab; closes with × or Escape |
| Brightspace/Blackboard/Moodle/Classroom | Session-based read-only import: Brightspace (enrollments, dropbox due dates, released final grades), Moodle (in-progress courses, upcoming activities), Blackboard Learn (courses, gradebook columns, scores, total); Google Classroom read-only API import (classes, classwork, own grades/submission state) when a Google OAuth client ID is configured | Mock-API tested; real institution APIs unverified; Moodle grades not imported; Classroom needs the Google client ID; Canvas-only in-page widgets |
| Languages/browsers | English; Chrome/Edge MV3 | Chrome unpacked verification; each release also attaches a Firefox MV3 ZIP (module background script, Gecko ID) that has not been loaded in Firefox or submitted to addons.mozilla.org; Spanish interface (workspace, popup, store name/description) with automatic or manual language choice; legal text and imported content stay as written; other languages and Safari not implemented |
| Monetization | No billing, quotas for upsell, subscription gates, BetterCampus entitlement requests | Implemented features all available free; hardware/provider limits still apply |

Tests establish the specified calculations, fixtures and original UI behavior; they do not establish identical behavior to the current production product. Remaining external requirements include chosen cloud hosting/identity, calendar OAuth app registrations, live LMS accounts/adapters, and installed local AI/transcription models. See README and REA-FINDINGS for evidence and setup.


October 21 update: independent GPA/to-do/notes/assignment/preview toggles, assignment count, full-width layout, overlay removal and workspace companion/quote controls are implemented. Theme images rotate across course cards; manual course overrides win. Supported theme settings survive native/legacy round trips. Remote fonts and complex sidebar backgrounds still fall back with warnings. Public catalog GETs, search and page 2 were checked live; the current BetterCampus extension’s import UI was not tested. This does not establish complete feature parity.


Active parity goal: all feature families above except friends remain in scope. Google, Microsoft/Outlook and Apple Calendar are required. No developer-operated server, backend deployment or developer data collection is permitted. OAuth/calendar and optional cross-device storage must connect directly to user-selected providers. Provider registrations and real-account tests remain external requirements, not completed features.

Theme rendering milestone: shared validated background grammar now preserves linear/radial gradients and HTTPS sidebar images, Google Fonts family names load through a stylesheet, and card image position/zoom controls are implemented. Browser tests verify rendered background syntax and image positioning; actual school CSP/font availability still needs live verification. Arbitrary custom CSS remains outstanding.
