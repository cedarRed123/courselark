# Open Campus privacy policy

Last updated October 15, 2026.

Open Campus is a browser extension that helps you organize coursework. It does not require an Open Campus account, show ads, or send analytics to its developer.

## Data the extension uses

When you choose **Connect this LMS site**, Open Campus requests access to that site's pages. When you choose **Import from this tab**, it reads your signed-in Canvas profile identifier, course names and metadata, assignment titles, descriptions, deadlines, submission status, and available grades from Canvas's same-origin API. It uses these details to display the dashboard, to-do list, and GPA estimates. It does not submit coursework or change Canvas grades. It only accesses connected sites and only imports when you ask it to.

You can also enter tasks, notes, study cards, grade adjustments, preferences, themes, and links, and attach files or audio. These records are stored in your browser's extension storage or IndexedDB on your device. Open Campus does not synchronize them to a developer server. They remain until you delete them or remove the extension. Removing the extension normally removes its local data; export any backup you want to keep first.

## When data leaves your device

Open Campus's optional local AI companion runs at `127.0.0.1` and sends selected notes/questions to your locally running Ollama model. Offline transcription can use local whisper.cpp. Browser speech recognition, if you choose it, may use your browser vendor's service according to its policies. Opening a playlist or other external link contacts its destination. Choosing **Google** or **Outlook** in the planner opens the provider with the task title and time in the URL; task notes are excluded. Exporting a backup or calendar file saves a copy wherever you choose. None of these optional actions is required to use the core extension.

The extension does not sell or share your data with the developer or advertisers. Your school, browser, operating system, optional AI/speech tools, and any external service you choose have their own practices. Open Campus uses browser notifications only if you turn on reminders. It does not request your Canvas password; your existing signed-in session is used for read-only import.

## Your choices

Disconnect an LMS site in Open Campus Settings to remove its future page access. You can also revoke site access in the browser's extension settings. Delete individual records in the app, export a backup, or remove the extension to clear its local storage. You may review this policy before connecting a school site.

For privacy questions, use the support contact shown on Open Campus's Chrome Web Store listing once published.
