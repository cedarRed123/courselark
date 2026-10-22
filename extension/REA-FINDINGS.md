# REA findings and feature scope

The GitHub source and current published extension are different versions. The inspected repository is **Better Canvas 5.12.6**, commit `c7d8bad4e6c2c10589f07e4497e0080a8cc2825a`. The [Chrome store listing](https://chromewebstore.google.com/detail/bettercampus-prev-betterc/cndibmoanboadcifjkjbdpjgfedanolh?hl=en) lists **BetterCampus 9.8.15**, updated October 7, 2026, with in-app purchases. Checked October 14, 2026.

## REA evidence

Command: `npx rea-agents@6.5.0 analyze-javascript-application <downloaded repository> --json`.

- Evidence ID: `ev_ebc18558f1c8c243c59f7e897876fab22724dbf9921c1454451b671731ec9ad9`.
- Input digest: `577d38b24549ea4a0fbf8e771de9d287fbbc31484e289780d7a5f9b2fb28cb71`.
- 17 relevant sources; 3 JavaScript files; 57,702 AST nodes; zero parse failures.
- All three JavaScript entrypoints pass syntax checks. Eleven files directly referenced by the manifest exist.
- Full evidence: an archived local REA analysis (not included in this repository).
- Compact source ranges and semantic node IDs: an archived local evidence summary (not included in this repository).

REA parsed inert text; it did not execute the extension or authenticate to Canvas. Function presence is source evidence, not proof of runtime behavior. The analyzer reports partial graph coverage and explicit unknown relationships.

## Features recovered from the older source

| Feature family | Source seed |
| --- | --- |
| Custom dark mode and troubleshooting | `generateDarkModeCSS` / `inspectDarkMode`, `js/content.js:1196` / `:400` |
| Dark scheduling | `autoDarkModeCheck`, `js/content.js:1238` |
| Course cards and due assignments | `customizeCards` / `loadCardAssignments`, `js/content.js:1548` / `:1409` |
| Todo lists, previews and completion | `loadBetterTodo`, `js/content.js:799` |
| College/high-school/cumulative GPA | `calculateGPA2` / `setupGPACalc`, `js/content.js:1639` / `:1799` |
| Dashboard notes | `loadDashboardNotes`, `js/content.js:1861` |
| Font customization | `loadCustomFont`, `js/content.js:1885` |
| Reminders | `updateReminders`, `js/content.js:159` |
| Theme discovery/import | `displayThemeListNew` / `importTheme`, `js/popup.js:984` / `:1634` |
| Community submissions/likes | `submitTheme` / `likeTheme`, `js/popup.js:771` / `:922` |

Additional source controls cover card images, colors, titles, links, visibility, gradients, density, sidebar/feedback/layout, tab icons, custom styles and due-date formatting. Theme registration/search/submissions/likes call `bettercanvas.diditupe.dev`. Targeted source searches found no checkout, subscription or entitlement implementation in this older repository.

## Current public requirements

The [current site](https://bettercampus.com/) advertises themes with rotation/history/image editing; subtasks, work times and calendar integration; study sets, file chat and annotations; flashcards, quizzes and four games; audio capture/transcription/history and AI cleanup; individual grade goals and trends; chosen playlists, focus/break/breathing intervals, agenda and quotes. Public descriptions also include leveling/streaks/friends, shared materials and multiple LMSs. The [rename page](https://bettercampus.com/bettercanvas/) identifies newer capabilities beyond the older source.

These are documentation-derived requirements. The 9.8.15 extension bundle and an authenticated production session have not been inspected. No source-backed statement about 5.12.6 should be presented as proof of 9.8.15 internals.

## Original implementation and remaining parity distinctions

The operator reports that CourseLark uses original application code and assets apart from its documented packages; see `PROVENANCE.md` for the scope and remaining rights review. It does not call BetterCampus's private backend or forge paid access. All implemented features are available without a subscription.

- Local theme sharing/import is not a hosted community with public reactions/review.
- Local progress/companions are not a friends network.
- ICS export or an event-composition link is not continuous, bidirectional Google/Outlook calendar synchronization.
- Rule-based extraction is not AI synthesis. Local AI needs its separately installed local model service.
- Saved audio is not transcription; transcription must be tested separately with a working engine.
- Canvas import is implemented using authenticated, same-origin GETs. Other LMSs remain visible-page course discovery/manual input unless explicitly implemented and tested.
- Institutional permissions, grade policy, browser microphone support and real-account behavior are not verified by synthetic tests.

## Integration verification

Nine Node integration tests cover paginated courses/assignments, permission revocation and registration, untrusted pagination, import preservation, account separation, privileged messages, connected-tab selection and reminder deduplication. Browser integration tests use synthetic Canvas HTML and mocked extension storage; they check injected styles/cards/grades/notes, safe previews, dynamic mounting, stale-style cleanup, workspace opening, disconnected-page restoration and absence of decoration on unconnected sites.

See `tests/integration.test.js` and `tests/browser-integration.mjs`. Browser tests need Playwright; set `COURSELARK_PLAYWRIGHT` to its `index.mjs` when it is not installed beside the project. These checks do not establish complete production parity.
