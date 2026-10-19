# Open Campus Privacy Policy

**Effective October 18, 2026**
**Operator:** Noah Fishman
**Contact:** ntfishman@gmail.com

Open Campus is an independent browser extension for organizing schoolwork. It has no Open Campus account, subscription, advertising, analytics, or developer-operated data collection endpoint. This policy explains what it accesses and how you control the data.

## Information handled

When you choose **Connect this LMS site**, Open Campus requests browser access to that LMS origin. When you choose **Import from this tab** while signed in to Canvas, it uses your current Canvas session to read your Canvas profile identifier, course and enrollment details, assignment titles, descriptions, deadlines, points, submission status, scores, and available grades. On other connected LMS pages, it may read visible course names and links. It uses this information for the dashboard, assignments, course cards, and grade estimates. It does not request your LMS password, submit coursework, or change official grades.

You may enter tasks, notes, study cards, grade adjustments, course details, themes, settings, links, files, and audio. The extension records local study activity, focus sessions, and task completion for its progress features. These records may contain personal information, website content, and user activity. They are stored in browser extension storage and IndexedDB on your device. The standalone dashboard may also use your browser profile's local storage. The extension does not send them to Noah Fishman or an Open Campus server.

## Optional transfers you control

- **Calendars:** Choosing Google or Outlook opens that provider with the task title and time in the URL. Task notes are excluded. Calendar and JSON backup exports save copies where you choose. Backups contain local records but exclude attached file blobs.
- **Speech and audio:** Audio recording is saved locally. Browser speech recognition is off by default. If you check its option before recording, audio may be processed by your browser provider under its own policy. The separate **Transcribe locally** action sends a recording to a service you run at `127.0.0.1:4317`, which can use a local whisper.cpp model. The companion writes temporary audio and transcription files on your computer and normally removes them after the request. An abrupt shutdown may leave temporary files.
- **AI through Ollama:** If you choose Smart notes, AI study set, or Ask about notes, the selected notes and prompt go to the companion service on your device and then to your configured Ollama service. Ollama can use cloud models; if configured that way, content may be processed remotely under Ollama's terms and policy. Open Campus does not verify local-only mode. The app asks before sending note content. For on-device processing, use a downloaded model and disable Ollama cloud features.
- **External links and images:** Opening an assignment, playlist, or custom link contacts its destination. A custom course image URL may cause your browser to request that image from its host, which can receive ordinary request information such as your IP address.
- **Notifications:** Assignment reminders are off by default for new installations; if enabled, browser or operating-system notifications may show assignment titles. Existing installations keep their current reminder choice until changed in Settings. Completing a focus session may show a separate notification.

The extension does not sell, rent, or share data with advertisers or data brokers. It uses data only for the features described here. Its use of information received from Chrome APIs complies with the [Chrome Web Store User Data Policy, including Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use/).

## Retention, choice, and security

Records remain in your browser profile until you delete them, clear browser storage, or uninstall the extension. Restoring a backup replaces dashboard records and removes attachment blobs no longer referenced by the restored notebooks. Backups exclude attachment blobs; references to unavailable attachments are removed during import. You can use **Erase local data** in Settings to delete this app's records and attachments from the current browser origin. Disconnecting an LMS origin revokes future access but does **not** delete previously imported data. Export attached files separately from each notebook. If you used the standalone dashboard in a separate browser origin, clear its storage separately. Exported copies and information sent to outside services are not deleted by these actions.

Local data security depends on your device and browser profile. Someone with access to an unlocked profile or exported backup may be able to read it. LMS access is limited to origins you approve through browser permission prompts; Canvas import uses the site's HTTPS connection and your signed-in session. The optional companion listens on the loopback address; do not expose it to a public network. No storage or transmission system is perfectly secure.

## Children, changes, and contact

Open Campus is intended for schoolwork, including K–12 use. It has no built-in age verification or parent/school authorization workflow. Accepting the Terms does not provide parental consent. Families and schools should review optional browser speech, AI, external images, calendar links, and public support channels before a child uses them. The operator is reviewing additional requirements for younger users; this policy does not assert that a school has authorized the extension. Material policy changes will be published here with an updated date before or with the relevant extension update.

If you email support, the operator receives your address, message, and any files you choose to send. Public GitHub issues expose their content to others. Do not send passwords, full backups, student records, or recordings through public issues. Support email and issue content are stored in those services until manually deleted; there is no automatic deletion schedule. Contact **ntfishman@gmail.com** to request deletion of information you voluntarily sent. The operator does not otherwise receive your locally stored extension records. Access and deletion of those records normally happen through the extension and browser profile.

This public policy page is hosted on GitHub Pages, which may process routine web requests and logs under [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). The policy page uses no analytics or advertising code.
