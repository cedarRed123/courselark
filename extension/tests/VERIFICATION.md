# Integration verification

Checked October 15, 2026. Open Campus 0.3.0. Playwright 1.64.1 / Chrome for Testing 156.0.8078.4 on macOS arm64. Automated test browsing used isolated profiles or synthetic fixtures. The live signed-in Canvas page and BetterCampus settings were inspected in Brave for layout and behavior comparison. Open Campus 0.3.0 was reloaded in that Brave profile, and both its Canvas navigation button and toolbar popup opened the workspace within the existing Canvas tab.

## Passed

- Dashboard UI smoke: task/class/notebook/set forms, final-score calculator, card flip/quiz, all game launches, theme builder, focus timer and reload persistence; no unhandled page errors.
- Four game interaction tests: Match penalty/completion, Blocks question-gated placement, Blast correct moving target, and Charms adjacent swap/cascade score.

- Forty-one Node tests: GPA term/current/cumulative/grade-basis math and backup migration; paginated course/assignment import, permission registration/revocation, unsafe pagination rejection, preserved local edits, locally completed tasks and subsequent Canvas submission, privileged message controls, most-recent connected tab selection and reminder deduplication; local server behavior.
- Headless browser content tests: imported GPA current/cumulative widgets, grading-scale control, grouped to-do completion tabs and local status persistence, native to-do replacement, card title/image/filter, imported grade, account-bound notes, inert assignment preview, dynamic cards, no observer feedback loop, stale-style cleanup, workspace launch and full restoration after disconnect. Unconnected sites receive no decoration.
- Real unpacked extension loads through Chrome's extension subsystem. Module service worker starts and initializes storage. Workspace ES modules/styles render under the actual extension CSP.
- Bundled PDF.js starts a real Worker, loads standard fonts and extracts fixture text.
- Notebook PDF upload retains extracted text and attachment metadata, renders the attached PDF into the annotation canvas, and survives workspace reload. This test reproduces and verifies the fix for the chrome.storage revision/object-reference race.
- Canvas navigation, toolbar routing and the GPA planner open the workspace inside the Canvas tab. An isolated real-extension test loads the framed workspace, closes it, and reopens directly to Grades & GPA with a fixture host grant. Live Brave inspection verified the navigation and toolbar launch paths in the signed-in Canvas tab.
- A configured but ungranted exact LMS origin does not register a content script. The real reminder alarm exists with a one-minute interval.
- The packaged extension reaches the local companion at 127.0.0.1:4317 without CSP/CORS blocking. An unconfigured Whisper request returns an explicit dependency error.
- No unhandled page errors or CSP/worker load errors in the successful packaged-extension smoke run.

## Defects caught and corrected

1. Chrome rejected `blob:` in `worker-src`; the manifest now allows packaged workers with `'self'` only.
2. Extension storage events could replace live state while an attachment was being processed, losing notebook mutations. Store revision handling and reacquiring the notebook by ID now preserve the upload.
3. Import initially used stale state, allowing in-flight edits to be overwritten; it now merges into latest storage.
4. Registrations initially ignored permission revocation and removed unrelated scripts; exact granted origins and the owned registration ID are now used.
5. Account identity and pagination controls were incomplete; imports now partition IDs by signed-in user, reject off-origin/off-endpoint pagination, detect loops and use request timeouts.
6. Card image/filter/title cleanup and unassociated-note handling now restore correctly as preferences change or the site disconnects.

## Limits

Actual permission-consent prompt acceptance, authenticated production Canvas data, institution-specific UI variants, other-LMS automation, configured Ollama/Whisper generation or transcription, microphone/audio behavior, browser notification delivery and cloud/calendar services are not established by these tests. Positive/revoked host permission logic and content OPEN messaging use mocks; the real extension confirms the ungranted-site case. Passing the local companion connection check does not mean a model is installed or a transcription ran.

## Reproduce

Run `npm test` for all 21 Node tests.

With Playwright and its browser installed and the companion running, run `npm run test:browser` for the UI, injected-page and game checks.

Start `node server.mjs` in another terminal, then run `node tests/extension-smoke.mjs`. If Playwright is installed elsewhere, set `OPEN_CAMPUS_PLAYWRIGHT` to the absolute path of its `index.mjs`. Optional `OPEN_CAMPUS_SCREENSHOT` and `OPEN_CAMPUS_SMOKE_REPORT` save outputs. The smoke creates and removes its own temporary browser profile. `tests/fixture.pdf` is an original synthetic one-page test document.


## 0.3.1 release security pass (October 15, 2026)

After the original 0.3.0 verification, privacy and HTML-safety fixes were applied. Unit tests: 42/42. Browser smoke and actual unpacked-extension smoke both passed. `npm audit --omit=dev --audit-level=moderate` found 0 known production dependency vulnerabilities. See `SECURITY-REVIEW.md` for scope, findings, and residual data boundaries.
