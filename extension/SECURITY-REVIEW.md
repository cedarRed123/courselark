# CourseLark 0.3.1 security and bug review

Reviewed October 15, 2026. Scope: the extension source, local companion source, package contents, and automated tests. This is a code and fixture-based review, not a guarantee against every vulnerability or a review of the user's browser profile, Canvas account, Google account, Ollama installation, or third-party services.

## Outcome

No embedded credentials, access tokens, private keys, personal Canvas records, telemetry endpoint, or hidden payment/entitlement check were found in the extension package. The ZIP contains only the Manifest V3 runtime (33 files, 4,146,961 uncompressed bytes), with `manifest.json` at its root. It excludes tests, screenshots, local backups, server source, npm files, and browser-profile data. SHA-256: `d6e2c31fc1beb1b62e5854e165842f4344a36b1a612eeb33563cefd386663613`.

The user chooses each HTTPS LMS origin before site permission is granted. Canvas API reads use the signed-in tab, same-origin credentials, bounded same-path pagination, and read-only GET requests. Privileged messages require the extension sender; the GPA summary additionally checks the connected top-level tab, school origin, and active Canvas account. The extension stores user data in browser-local storage and IndexedDB. It has no developer telemetry backend.

## Issues fixed in 0.3.1

- External calendar composition URLs previously included private task notes. Google/Outlook links now contain only the task title and time. The planner explains that these values go to the chosen provider.
- Imported Canvas assignment scores and point totals are now normalized to finite numbers or null before persistence. Existing numeric fields used in HTML templates are escaped, closing an HTML injection path for malformed/imported values.
- The LMS popup now explains the data accessed and saved before connection/import. In-app data wording and the privacy policy now describe optional external services accurately.

## Remaining data boundaries

- Local browser storage and files are not encrypted by CourseLark. Anyone with access to the unlocked browser profile or exported backups may read them. This is a device/account access boundary, not a developer upload.
- The Canvas overlay intentionally displays grades and assignments inside the signed-in Canvas tab. Browser notifications can show an assignment title when reminders are enabled.
- Choosing an external calendar or playlist service opens that provider. A calendar link contains the task title and time in its URL, so these may appear in browser history or provider logs. The optional browser speech-recognition service may send audio to the browser vendor. Optional AI sends selected notes/questions through the loopback companion to configured Ollama, which may use a cloud model.
- A school administrator or Canvas itself controls what the signed-in Canvas API returns; this review does not validate the school's grade policy. PDF.js and fflate are bundled third-party libraries with their own licenses. Browser/extension updates and future dependencies should be reviewed before each release.
- The optional standalone companion accepts requests from local pages and Chrome extension origins while it runs on loopback. It does not expose stored CourseLark data, but other locally installed extensions may be able to use its AI processing endpoint. Do not run it on an untrusted machine profile.

## Bug and dependency checks

The October 18 remediation branch adds opt-in reminders, a versioned Terms gate, backup attachment cleanup, and a clear-data control. `npm test`: 43/43 passed, including an unaccepted Terms import block. `npm run test:browser`: dashboard/workspace interaction and content-script smoke passed. `npm run test:extension`: real unpacked Manifest V3, CSP/PDF worker, backup attachment cleanup, clear-data control, local companion reachability, and same-tab panel tests passed. The local transcription smoke intentionally received a 500 response because Whisper is not installed; the test verified the resulting error handling. Actual configured Ollama/Whisper processing and K–12 authorization workflows remain unverified.

Limitations: the tests use synthetic Canvas fixtures and an isolated Chromium profile; production Canvas variants, actual optional-host consent, external calendar services, microphone capture, configured Ollama/Whisper, and Chrome Web Store review are not fully verified.

## Store status

On October 17, 2026, the user showed an existing Chrome Web Store publisher account. CourseLark 0.3.1 was uploaded there as draft item `neblllanaehpdoinopcpemcmnfnfppml`. The store description, Education category, English (United States) language, icon, synthetic screenshot, permission explanations, and data-use categories were saved. It has not been submitted for review or published. The dashboard requires a public privacy-policy URL, publisher contact email and its verification, and data-use certifications before submission.

## October 19 companion hardening candidate

The v0.3.3 review branch requires a 64-character pairing code for companion AI and transcription POST requests. The code appears in the local companion terminal, is entered in Settings, and is stored in the browser outside JSON backups. The server rejects unpaired requests before invoking Ollama or Whisper. It remains a bearer secret: anyone who obtains it while the companion runs can use those endpoints, and this does not establish that a configured Ollama model processes data only on-device. This candidate has not been published.
