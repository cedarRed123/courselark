# Open Campus

A free, open-source Chrome/Edge MV3 campus companion. Implemented features have **no Open Campus subscription, account requirement, paywall, paid unlock, monthly counters, or remote entitlement checks**. Open Campus is an independent, local-first alternative to BetterCampus, with original code and assets and no BetterCampus affiliation or endorsement. It is **not a complete duplicate of BetterCampus 9.8.15**. See [FEATURE-COVERAGE.md](FEATURE-COVERAGE.md) and [REA-FINDINGS.md](REA-FINDINGS.md) for verified scope and remaining gaps.

## Install the extension

1. Extract `open-campus.zip`, keeping its directory structure.
2. Open `brave://extensions`, `chrome://extensions`, or `edge://extensions` and enable **Developer mode**.
3. Choose **Load unpacked**, then select the `open-campus` folder containing `manifest.json`.
4. Pin Open Campus, then open your school's signed-in Canvas tab.
5. Click the extension → **Connect this LMS site** and grant access to that exact site.
6. Click **Import from this tab**. Reload the LMS tab if needed. Import again when assignments/grades change; imports are read-only.
7. Click **✦ Open Campus** in Canvas navigation, or the extension icon → **Open dashboard**, to open the workspace in a panel over Canvas.

If an older unpacked Open Campus is already loaded from this folder, use **Reload** on its extension card, then reload the Canvas tab. Click **✦ Open Campus** in Canvas navigation to open a large panel within that tab. The panel closes with its × button or Escape. **Open grade planner** in the GPA widget opens directly to Grades & GPA in the same panel. The Canvas dashboard also places GPA above course cards and a week-based to-do list in the right sidebar. The GPA settings let you choose whole-letter or plus/minus grading, term, course credits, exclusions, prior GPA, and a term goal. Imported assignment completion changes only local Open Campus tracking; it never submits Canvas work.

There is no build step and no npm installation needed to use the extension. It only decorates connected sites. Tasks, courses, notes, study sets and themes persist in extension storage. Attached files/audio and PDF ink persist in IndexedDB. Removing the extension removes its storage, so export backups and attachment files first.

## What you can do

- Theme Canvas, schedule dark mode, rotate original/custom themes, import/export/remix themes, retain theme history; customize course images, colors, brightness, blur, names, codes, links, visibility and layout.
- Import Canvas courses, assignment descriptions, deadlines, current grades and submission status. Plan local subtasks, notes and work blocks. Receive desktop reminders while Chrome runs.
- Calculate credit-weighted current-term and cumulative GPA, individual course goals, final-score requirements, points-based assignment what-ifs and local grade trends.
- Keep class notebooks; import text, searchable PDFs, PPTX slides and DOCX text; annotate PDF pages with adjustable pens and export annotated pages as PNG.
- Record microphone audio and keep local playback/export history. Browser speech recognition is optional and may contact the browser vendor. Offline transcription uses your own local whisper.cpp engine.
- Make manual/rule-based study sets, flashcards and quizzes; play original Match, Blocks, Blast and Charms games. Earn local companion XP and daily study streaks.
- Use custom focus/break timers, breathing duration, playlist links, agenda and motivation quote.
- Export/import JSON backups, theme files and ICS calendars. Compose Google/Outlook calendar events (task title and time are included in provider URLs; private notes are excluded). These are exports/event links, not continuous calendar sync.

## AI through Ollama and offline transcription (optional)

The core extension works without a server. AI features require a separately installed Ollama service; this project does not include model weights or a paid API. Ollama may use cloud models, and Open Campus does not verify local-only mode.

1. Install/run [Ollama](https://docs.ollama.com/), then download a model appropriate to your computer, for example `ollama pull qwen3:4b`.
2. In the `open-campus` folder run `node server.mjs` with Node.js 24+. It binds to `127.0.0.1:4317` and forwards AI requests to Ollama on port 11434. Ollama's own configuration determines where the model runs.
3. In Settings, enter the model name. Choose **Check AI connection**. To keep processing on-device, use a downloaded model and [disable Ollama cloud features](https://docs.ollama.com/faq#how-do-i-disable-ollamas-cloud-features).
4. In a notebook, **Smart notes**, **AI study set**, and **Ask about notes** send selected notes and prompts to Ollama after a confirmation. Generated answers/cards need review against your source material.

For offline audio transcription, install [whisper.cpp](https://github.com/ggml-org/whisper.cpp), obtain a compatible model, and install ffmpeg. Start the companion with paths to your executables/model:

```sh
WHISPER_COMMAND=/absolute/path/to/whisper-cli \
WHISPER_MODEL=/absolute/path/to/ggml-base.en.bin \
FFMPEG_COMMAND=/absolute/path/to/ffmpeg \
node server.mjs
```

Open saved audio in a notebook → **Transcribe locally**. The companion normally deletes temporary audio and transcript files after processing; an abrupt shutdown may leave them behind. Without the engine/model the UI reports the missing configuration. Real model generation and real microphone/Whisper transcription have not been verified on this machine.

The companion also serves a standalone dashboard at `http://127.0.0.1:4317`. Its browser storage is separate from extension storage; transfer ordinary data via JSON backup. LMS import/reminders require the installed extension. The transport bounds requests at 128 MB (16 MB for AI JSON) to prevent resource exhaustion, not to sell an upgrade. Local disk, memory, context window and browser limits still apply.

## Calculation and import boundaries

The Canvas GPA overview defaults to a whole-letter scale (A=4, B=3, C=2, D=1, F=0) and offers plus/minus grading in settings. It weights by credit hours and excludes unknown grades. Imported classes initially assume three credits until edited. Current-term and cumulative estimates use available Canvas term, enrollment, posted grade, and course state data; earlier credits/GPA can be added manually. Your school's official transcript policy may differ.

Canvas current scores come from its API. Assignment what-ifs use a points-based model, not automatic dropped-score/assignment-group grading policy. Canvas imports require your existing authorized login, honor pagination and access errors, distinguish accounts/sites, and preserve local scheduling and notes. They never submit coursework or modify official grades. Imported data is a snapshot. A school may disable/restrict an API.

PDF extraction works for searchable text; image scans need OCR that is not included. PPTX/DOCX import extracts text, not every visual/embedded object. PDF ink is saved per page and exported as an image, not rewritten into a full PDF. Theme sharing is via JSON; there is no cloud community/friends backend. The custom soundtrack opens a provider's playlist page and does not bypass that provider's access rules.

## Verify

```sh
npm test
```

Node unit/integration/server tests require no installed dependencies. For browser checks install Playwright for development and its Chromium browser, then:

```sh
npm install
npx playwright install chromium
npm run test:browser
```

Start `node server.mjs` in another terminal before browser tests. `npm run test:extension` checks the actual unpacked extension in an isolated Chrome profile.

`tests/VERIFICATION.md` records actual results, fixture scope, and limitations. The REA source analysis identifies the older repository; it does not prove current production extension behavior. No BetterCampus source, artwork, hosted themes, or private service credentials are bundled.

## Privacy

See [PRIVACY.md](PRIVACY.md). Canvas import is read-only and requires an explicit site connection and import action. Data stays in extension-local storage unless you choose an external service, export, or optional browser speech recognition.

## License

Original code/assets: MIT, see LICENSE. Bundled PDF.js and fflate retain their separate licenses in `src/vendor` and [THIRD-PARTY.md](THIRD-PARTY.md). Open Campus is independent of BetterCampus and LMS vendors.
