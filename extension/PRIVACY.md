# Open Campus Privacy Policy

**Effective October 21, 2026**

**Operator:** Noah Fishman  
**Contact:** ntfishman@gmail.com

Open Campus is an independent browser extension for organizing schoolwork. It has no Open Campus account, subscription, advertising, analytics, or developer-operated data collection endpoint. This policy explains what it accesses and how you control the data.

## Information handled

When you choose **Connect this LMS site**, Open Campus requests browser access to that LMS origin. When you choose **Import from this tab** while signed in to Canvas, it uses your current Canvas session to read your Canvas profile identifier, course and enrollment details, assignment titles, descriptions, deadlines, points, submission status, scores, and available grades. On other connected LMS pages, it may read visible course names and links. It uses this information for the dashboard, assignments, course cards, and grade estimates. It does not request your LMS password, submit coursework, or change official grades.

You may enter tasks, notes, study cards, grade adjustments, course details, themes, settings, links, files, and audio. The extension records local study activity, focus sessions, and task completion for its progress features. These records may contain personal information, website content, and user activity. They are stored in browser extension storage and IndexedDB on your device. The standalone dashboard may also use your browser profile's local storage. The extension does not send them to Noah Fishman or an Open Campus server.

## Optional transfers you control

- **Fonts:** Selecting or installing a Google Fonts family loads its stylesheet from fonts.googleapis.com and font files from fonts.gstatic.com. Google receives normal network request information. Installed/system fonts do not require these requests.
- **Community themes:** Opening Community themes requests optional access to `api.bettercampus.com`. Browsing, searching, paging and previewing contact that public service with the search text, page number or theme code. Requests omit account credentials and referrers. The service receives ordinary network information such as your IP address. Open Campus does not send notes, tasks, grades or LMS credentials to it. Installing an imported theme can load HTTPS images from their original hosts. Theme files and settings are saved locally.
- **Calendars:** Choosing Google or Outlook opens that provider with the task title and time in the URL. Task notes are excluded. Calendar and JSON backup exports save copies where you choose. Backups contain local records but exclude attached file blobs.
- **Speech and audio:** Audio recording is saved locally. Browser speech recognition is off by default. If you check its option before recording, audio may be processed by your browser provider under its own policy. The separate **Transcribe locally** action sends a recording to a service you run at `127.0.0.1:4317`, which can use a local whisper.cpp model.
- **Local AI:** If you choose Smart notes, AI study set, or Ask about notes, the selected notes and prompt go to the companion service you run at `127.0.0.1:4317` and its configured local Ollama model. Open Campus does not configure a remote AI provider for you.
- **External links and images:** Opening an assignment, playlist, or custom link contacts its destination. A custom course image URL may cause your browser to request that image from its host, which can receive ordinary request information such as your IP address.
- **Notifications:** If you enable reminders or complete a focus session, browser or operating-system notifications may show task titles and deadlines.

The extension does not sell, rent, or share data with advertisers or data brokers. It uses data only for the features described here. Its use of information received from Chrome APIs complies with the [Chrome Web Store User Data Policy, including Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use/).

## Retention, choice, and security

Records remain in your browser profile until you delete them, replace them with a backup, clear browser storage, or uninstall the extension. Disconnecting an LMS origin revokes future access but does **not** delete previously imported data. You can delete records in the app, export a backup, or remove the extension. Export attached files separately from each notebook.

Local data security depends on your device and browser profile. Someone with access to an unlocked profile or exported backup may be able to read it. LMS access is limited to origins you approve through browser permission prompts; Canvas import uses the site's HTTPS connection and your signed-in session. The optional companion listens on the loopback address; do not expose it to a public network. No storage or transmission system is perfectly secure.

## Children, changes, and contact

Open Campus is a general schoolwork tool. It does not knowingly collect information from children for a developer-operated service. School and family rules may govern a student's use of browser extensions and LMS accounts. Material policy changes will be published here with an updated date before or with the relevant extension update.

For privacy questions, contact **ntfishman@gmail.com**. The developer does not hold your extension records, so access and deletion normally happen through the extension and browser profile. The host of this public policy page may process routine web requests, including IP addresses and server logs, under its own terms. The policy page uses no analytics or advertising code.
