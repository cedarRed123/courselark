# Chrome Web Store listing draft

Name: Open Campus

Short description: Local-first Canvas companion for assignments, GPA estimates, notes, study sets, and themes. No account or subscription.

Detailed description:
Open Campus adds a study workspace inside your connected Canvas tab. See upcoming assignments and a weekly to-do list, estimate term and cumulative GPA, organize notes and flashcards, plan work blocks, and customize your dashboard. Connect only the school site you choose; import is read-only and runs when you request it. Core features work without an Open Campus account or subscription. Optional local AI requires a separately installed Ollama model and the included local companion. Grade estimates may differ from official school records. Open Campus is independent of Canvas/Instructure and BetterCampus.

Single purpose: Organize and study coursework from a connected learning-management site in a browser workspace.

Permissions justification:
- storage and unlimitedStorage: keep user-created tasks, notes, course data, themes, and attached files locally.
- activeTab and scripting: connect the current LMS tab and run a user-requested read-only import.
- alarms and notifications: optional assignment reminders.
- optional HTTPS site access: the user grants an individual school site for the Canvas panel and same-origin import. Loopback access supports the optional local AI companion.

Data use declaration: Educational records, including course/assignment data and grades, plus user-entered notes and files are handled locally to provide requested features. No analytics, advertising, or sale of data. Optional user actions can open an external calendar/playlist site or browser speech service; see PRIVACY.md.

Listing screenshot: use a synthetic-data screenshot only. Do not use the signed-in UT Canvas screenshot in this workspace.

Before submission: sign into and register a Chrome Web Store developer account, host the privacy policy at a public HTTPS URL, review the listing and privacy declarations, and provide any required contact details and screenshots.
