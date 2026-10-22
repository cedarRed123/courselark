# Chrome Web Store data and permission review map

Prepared October 19, 2026 for the **CourseLark 0.3.3 review candidate**. This is a code-to-disclosure map, not a record of the submitted dashboard selections or a certification of compliance. Review the actual uploaded ZIP and the Web Store form together before changing any declaration.

Google says extensions must disclose user-data handling even when processing and storage remain on the user's device. The Web Store privacy form asks for a single purpose, permission justifications, remote-code declaration, data categories, limited-use certifications, and a policy URL. Inconsistencies among code, the dashboard, and the policy can lead to enforcement. Sources: [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/), [privacy-fields guide](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/), [disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements/).

The candidate popup and dashboard now show a concise data-and-optional-transfer summary before **Agree and continue**. The real-extension smoke test checks both surfaces before acceptance. This in-product notice does not replace the separate pre-installation Web Store disclosure or authorize any optional third-party transfer by itself.

## Proposed single purpose

Organize and study coursework from user-connected LMS sites in a browser workspace. The dashboard, assignment list, GPA estimates, notebooks, study tools, themes, and optional reminders serve that purpose. The optional local companion supports note-based study and transcription; it is not required for core coursework organization. Confirm this wording fits the actual dashboard field and product scope.

## Data flows to reconcile

| Data / possible Web Store category | Trigger and source | Destination and recipient | Evidence / declaration question |
| --- | --- | --- | --- |
| Host access to HTTPS pages (optional, requested once at Terms acceptance) | Content script checks each page for LMS markers and exits otherwise; recognized LMS origins auto-connect | Nothing leaves the browser; no developer endpoint | `src/content.js` `lmsPage`, `src/background.js` `AUTO_CONNECT`, `registerSites`. Justify `https://*/*` optional host permission: schools use custom LMS domains, so per-domain lists cannot cover them; per-site turn-off in Settings. |
| Canvas profile identifier; potentially personally identifiable information | Automatic import on enabled sites (and the first import after **Enable on this site**) calls Canvas's signed-in `users/self/profile` API to scope school and account records | Browser extension storage; no developer endpoint | `src/background.js` `collectLMS` and `mergeLMS`; `src/store.js`. Check the dashboard's identifier/PII choice. The imported numeric user ID counts as an identifier even though the extension does not ask for a password. |
| Course names, enrollment, assignment titles/descriptions/deadlines, scores, grades; website content and education records | User connects one LMS origin, grants browser permission, then starts import | Browser extension storage; Canvas API requests stay on that HTTPS origin | `src/background.js` `collectLMS`; `src/app.js` dashboard and GPA. Website-content disclosure is warranted; local storage does not remove the disclosure duty. |
| Visible course names/links on non-Canvas connected LMS pages; website content | User grants that origin and requests import | Browser extension storage | `src/background.js` fallback page collector. It does not claim automatic assignment/grade import from those systems. |
| User-created tasks, notes, study cards, course edits, themes, files, recordings; user-generated content and potentially sensitive content | User enters or imports material into the workspace | Browser storage and IndexedDB; local JSON/ICS/file exports only when requested | `src/app.js`, `src/store.js`. Files and free-text notes can contain sensitive material chosen by the user; do not declare that no user data is handled. |
| Study activity, task completion, focus sessions; user activity | User completes tasks or uses study/focus tools | Browser storage for streaks, progress and scores; optional reminder titles appear in browser/OS notifications | `src/core.js` `recordActivity`; `src/app.js`; `src/background.js` reminder alarm. Check the user-activity category. Reminders default off on a new install. |
| Connected school origin and active account ID; site/URL information | User connects a site; extension checks the current tab and permission | Browser storage and Chrome runtime for routing imports | `src/background.js` `normalizeSite`, `registerSites`, `collectLMS`; `src/popup.js`. This is not general browser-history collection, but confirm how the dashboard classifies connected-site URLs. |
| Task title and time sent to Google or Outlook Calendar | User clicks an external calendar action | Calendar provider through a compose-page URL; task notes excluded | `src/core.js` `calendarLink`; `src/app.js`. The transfer is optional and initiated by the user. |
| Task titles, times and assignment links synced to iCloud; Apple ID email and app-specific password (authentication information) | User connects iCloud calendar sync in Planner; then automatic every 5 minutes | Directly to iCloud CalDAV; credentials kept in extension storage, excluded from backups; no developer endpoint | `src/calendar-sync.js`, `src/background.js` `calendarSync`, `src/app.js` `calendarCard`. Optional hosts `caldav.icloud.com`, `*.icloud.com`. No `identity` permission and no OAuth apps. Google/Outlook use a user-saved .ics file. |
| Settings, themes and custom CSS in browser sync storage | User turns on Sync across devices in Settings | Browser vendor's account sync (`chrome.storage.sync`); no developer endpoint | `src/device-sync.js`, `src/background.js` `pullRemote`. Excludes LMS records and credentials. |
| Canvas announcements (title, text, date, link) | Automatic import on enabled sites | Browser extension storage only | `src/background.js` `collectLMS` announcements block; `src/core.js` `mergeLMS`. Website content category. |
| Brightspace/Moodle/Blackboard user ID, courses, assignments/activities, due dates, scores and grades | Automatic import on enabled sites | Browser extension storage only | `src/background.js` `collectLMS` adapters. Moodle session key is read from the page and used only for same-origin requests. |
| Custom course image request | User saves an HTTPS image URL for a card and views it | Chosen image host receives a normal browser request, including ordinary network metadata | `src/app.js` card form; `src/content.js` card decoration. The privacy policy discloses this host request. |
| Audio sent to browser speech provider | User checks the unchecked browser-transcription option and records | Browser/provider according to its own implementation and policy | `src/app.js` `startRecording`. The browser's processing location is not verified by CourseLark. |
| Notes/prompts sent to Ollama; possible remote AI recipient | User pairs the companion, selects an AI action, and confirms sending note content | Loopback companion, then configured Ollama service; cloud models may process remotely | `src/app.js` `localAI`; `server.mjs` `/api/chat`. The app does not verify local-only mode. Do not describe all AI processing as strictly local. |
| Recording sent for optional local transcription | User pairs the companion and selects **Transcribe locally** | Loopback companion and configured whisper.cpp process; temporary local files normally removed after request | `src/app.js` `audio-transcribe`; `server.mjs` `/api/transcribe`. An abrupt shutdown may leave temporary files. |
| Support email / public GitHub issue content | User voluntarily contacts the operator or posts an issue outside the extension | Email provider or public GitHub issue; operator may read and respond | `PRIVACY.md` states the operator-confirmed manual-deletion practice. Do not present public issues as a private support channel. |

The code review found no built-in analytics, advertising, data sale, password extraction, automatic cloud sync, or developer-operated collection endpoint in the candidate. This is a bounded finding, not proof that arbitrary user-entered files contain no health, financial, authentication, or personal-communication data. Review each checkbox using the form's exact wording and the final candidate behavior.

## Permission and remote-code checks

| Manifest item | Current use to compare with dashboard justification |
| --- | --- |
| `storage`, `unlimitedStorage` | Local coursework, settings, files metadata, and pairing code; attachment blobs use IndexedDB. |
| `activeTab`, `scripting` | User-requested import from the selected signed-in LMS tab. |
| `alarms`, `notifications` | Optional assignment reminders and focus-session completion notification. |
| Optional `https://*/*` host access | The popup requests only the chosen HTTPS LMS origin; registered content scripts are scoped to granted origins. Check that the dashboard explanation makes the per-site request clear. |
| Optional loopback hosts | User-requested local companion AI/transcription after pairing. |
| Remote code | Application JavaScript, PDF.js, fflate and fonts are bundled. AI text is treated as content, not executed as code. Check the exact uploaded ZIP and dashboard declaration. |

## Required comparison before submission

1. Open the **same publisher item** and inspect the actual Privacy practices selections; record the item ID, package version, and screenshot or exported values in a private review record. This document does not claim access to them.
2. Compare each selected data category and permission explanation with the table above, `manifest.json`, the final ZIP, `PRIVACY.md`, and the live policy URL. Resolve disagreements before certification.
3. Confirm the live Privacy Policy at `https://cedarred123.github.io/open-campus/privacy/` reflects the candidate; the draft branch alone does not update the public page.
4. Confirm the listing's optional AI, browser speech, custom images, calendar transfers, free/no-paywall claims, and independent branding match the uploaded build.

The under-13 K–12 audience and source/asset rights still require their separate release decisions. A checked dashboard form would not resolve either one.
