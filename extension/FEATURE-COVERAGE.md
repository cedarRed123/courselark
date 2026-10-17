# Feature coverage — October 14, 2026

**This is not complete production parity with BetterCampus 9.8.15.** Implemented features have no paywalls. The repository analyzed with REA is version 5.12.6; current additional requirements come from the public website/store. Original source/assets have not been copied into this implementation.

| Public feature | Open Campus implementation | Status / boundary |
| --- | --- | --- |
| Dark mode, custom colors | Original palettes, editable theme colors | Implemented; representative Canvas fixture tested, institution layouts unverified |
| Schedule/device dark mode | Time windows and system preference | Implemented and tested |
| Themes, builder, remixes | Five original presets; unlimited local themes/remixes; JSON import/export | Implemented; does not include BetterCampus's theme library |
| Auto-rotate and history | Daily rotation; unrestricted local history | Implemented; daily rotation does not add history snapshots |
| Image editor | Per-card HTTPS background, brightness, blur | Implemented; no crop/advanced bitmap editor |
| Community themes, reactions, submissions | Theme files shared manually | Hosted community, likes/comments/review not implemented |
| Fonts, gradients, density/sidebar controls | Five installed font families; gradients, compact cards, hide logo/feedback, show links/grades | Implemented subset; custom arbitrary font loading, tab icons and custom CSS not implemented |
| Course customization | Colors/images/names/codes/visibility/custom links; existing Canvas images preserved unless overridden | Implemented; fixture verifies injection/restoration |
| Assignment list/deadlines | Canvas paginated same-origin API import, search/filter, completion; inline Canvas right sidebar with timeframe, groups, progress and local add task | Implemented and synthetic integration tested; refresh is manual |
| Dashboard assignment preview | Text-only descriptions in workspace and injected Canvas cards | Implemented; dashboard announcement preview not implemented |
| Subtasks, notes, work times | Per-task local controls, agenda grouping | Implemented, persistence tested |
| Todo progress visuals | In-page progress ring, grouped cards, completed tab, course colors and task count | Implemented in fixture; original browser installation was unavailable for live post-change visual verification |
| Assignment reminders | Browser alarms, deduplicated notifications, configurable lead | Implemented with mock extension tests; OS notification behavior unverified |
| Plan/calendar sync | Work blocks, ICS export, Google/Outlook event links | Continuous/bidirectional OAuth calendar sync not implemented |
| Credit-weighted GPA | Current and cumulative in-page overview; configurable whole-letter or plus/minus scale, credits, course exclusions, prior GPA and term choice; standalone grade planner | Implemented and tested; school-specific arbitrary point scale editor remains unimplemented |
| Individual grade goals | Per-course goals and final-score requirement | Implemented and tested |
| Assignment what-if | Hypothetical points-based grades | Implemented; weighted/drop-rule policies not mirrored from LMS |
| Grade trends | Local score snapshots with bar chart | Implemented; no historical server data |
| Notes by class/task | Class notebooks, task notes, dashboard excerpts | Implemented, persistence tested |
| Notes/files uploads | Text/MD/CSV/JSON, searchable PDF, DOCX, PPTX text extraction | Implemented; scanned-document OCR and full slide visuals are not included |
| PDF annotation | Pen colors/sizes, page ink stored locally, annotated-page PNG export | Implemented; full annotated-PDF export not included |
| Audio notes/history | Local microphone recording, playback, separate audio exports | Implemented; real microphone/device behavior unverified |
| Live transcription | Browser speech recognition when supported | Optional; vendor service may be used, support varies |
| Offline transcription | Local ffmpeg → whisper.cpp adapter | Engine/model required; real transcription unverified |
| Smart notes, file chat | Local Ollama proxy, notebook context including extracted file text | Implemented adapter; real model generation unverified |
| AI study-set generation | Requested count/difficulty, validated JSON cards, edit before use | Implemented adapter; model-dependent accuracy and limits |
| Flashcards/quizzes/study sets | Unlimited local sets, flipping, multiple-choice practice with correct definition | Implemented and browser tested; explanation is the source definition |
| Match | Term-definition pairing; time penalty for wrong pairs | Original game implemented |
| Blocks | Earn blocks through questions; fill rows/columns to score | Original single-cell block game implemented; not an identical puzzle engine |
| Blast | Click falling definition asteroids; correct hits score, wrong hits cost time | Original game implemented |
| Charms | Adjacent swaps, match-three cascades, question-gated additional moves | Original game implemented |
| High scores | Stored per set/game | Implemented locally |
| Companion/streaks/levels | Original Sprout character with XP and daily activity streak | Implemented locally; not Campy artwork/animations |
| Friends/community/public materials | No remote social backend | Not implemented |
| Cross-device account sync | JSON backups and separate attachments | Accounts/cloud synchronization not implemented |
| Custom playlists | User-supplied provider URL | Implemented link; no in-app playback/provider account integration |
| Custom focus/break timers | Deadline-based local timer, pause/reset, notifications | Implemented; browser/workspace must remain open |
| Breathing breaks | Adjustable duration, inhale/exhale animation | Implemented |
| Agenda/motivational quotes | All upcoming work/due dates; editable quote | Implemented |
| Canvas | Authenticated read-only import and inline GPA/to-do enhancements | Implemented; updated extension loaded on the user's live Canvas page in Brave; official import and GPA accuracy still depend on Canvas data and school policy |
| Workspace panel in Canvas | Full workspace opens in an embedded modal from Canvas navigation or the toolbar popup; grade planner opens the GPA page in the same tab | Tested in isolated Chromium and in the user's live Brave Canvas tab; closes with × or Escape |
| Brightspace/Blackboard/Moodle/Classroom | Visible-page course discovery, generic styling, manual tasks/grades | Full automatic assignments/grades import not implemented |
| Languages/browsers | English; Chrome/Edge MV3 | Chrome unpacked verification; multilingual/Firefox/Safari ports not implemented |
| Monetization | No billing, quotas for upsell, subscription gates, BetterCampus entitlement requests | Implemented features all available free; hardware/provider limits still apply |

Tests establish the specified calculations, fixtures and original UI behavior; they do not establish identical behavior to the current production product. Remaining external requirements include chosen cloud hosting/identity, calendar OAuth app registrations, live LMS accounts/adapters, and installed local AI/transcription models. See README and REA-FINDINGS for evidence and setup.
