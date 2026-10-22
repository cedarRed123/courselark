# Chrome Web Store listing draft

Name: CourseLark

Short description: Local-first Canvas companion for assignments, GPA estimates, notes, study sets, and themes. No account or subscription.

Detailed description:
CourseLark is a free, open-source and independent alternative to BetterCampus for Canvas users. There is no CourseLark account, subscription or paywall. It adds a study workspace inside your connected Canvas tab: upcoming assignments and a weekly to-do list, term and cumulative GPA estimates, notes, flashcards, work planning and dashboard themes. You choose which school site to connect; imports are read-only and run when you request them. Optional AI requires the separately installed Ollama service and companion plus a pairing code shown by the companion; Ollama can use local or cloud models depending on your setup. Grade estimates may differ from official school records. Source code: https://github.com/cedarRed123/open-campus. CourseLark is not affiliated with or endorsed by BetterCampus, Canvas/Instructure or any school.

Single purpose: Organize and study coursework from a connected learning-management site in a browser workspace.

Permissions justification:
- storage and unlimitedStorage: keep user-created tasks, notes, course data, themes, and attached files locally.
- activeTab and scripting: connect the current LMS tab and run a user-requested read-only import.
- alarms and notifications: optional assignment reminders.
- optional HTTPS site access: the user grants an individual school site for the Canvas panel and same-origin import. Loopback access supports the optional Ollama companion.

Data use declaration: Educational records, including course/assignment data and grades, plus user-entered notes and files are stored in the browser to provide requested features. No analytics, advertising, or sale of data. Optional actions can open external calendar/playlist sites, use browser speech processing, or send selected notes to configured Ollama models that may run in the cloud; see PRIVACY.md.

Listing screenshot: use a synthetic-data screenshot only. Do not use the signed-in UT Canvas screenshot in this workspace.

Before a revised submission: verify the final uploaded ZIP, public policy URL, listing, and every privacy declaration against the candidate code. Use synthetic screenshots and preserve manual publication. Resolve the release gates in `RELEASE-READINESS.md` first.
