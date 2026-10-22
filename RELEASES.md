# Automated extension releases

Changes under `extension/`, `scripts/`, or the release workflow on `main` run unit tests, browser integration tests, and unpacked-extension smoke tests. Pull requests run the same checks without publishing. After checks pass, GitHub Actions creates a tagged GitHub Release containing the runtime-only ZIP and SHA-256 checksum **only when** the repository variable `RELEASE_APPROVED_VERSION` exactly matches the source manifest's three-part version. The same ZIP may then be submitted to Chrome Web Store API v2 when `CWS_ENABLED=true`. Leave the approval variable unset until the release checklist has been completed. Change or remove it before starting review of a new base version.

The three-part source manifest version is the base. CI appends `github.run_number`, producing versions such as `0.3.2.12`. Rerunning a run keeps its version. Keep the base version increasing; do not reset the workflow run counter. Each component must be at most 65535. The tag points to the source commit; the attached ZIP contains the generated four-part manifest. No version bump commits or tagging by hand are necessary.

## Chrome Web Store connection

The existing Web Store item is `neblllanaehpdoinopcpemcmnfnfppml`. The [October 20 automated 0.3.2.5 run](https://github.com/cedarRed123/courselark/actions/runs/39349873347) reported `PENDING_REVIEW`; check the current dashboard before relying on that status. That package predates the candidate legal-notice fix.

1. Enable the Chrome Web Store API in a Google Cloud project.
2. Create a dedicated service account and link its email in the Chrome Web Store developer dashboard's Account settings. Follow [Google's service account instructions](https://developer.chrome.com/docs/webstore/service-accounts).
3. Store its JSON key as the GitHub repository Actions secret `CWS_SERVICE_ACCOUNT_JSON`. Upload it directly in GitHub settings or use `gh secret set CWS_SERVICE_ACCOUNT_JSON < /path/to/key.json`; never commit it or paste it into chat.
4. Set repository Actions variables `CWS_PUBLISHER_ID` (Publisher > Settings in the developer dashboard), `CWS_EXTENSION_ID` (the item ID above), and `CWS_ENABLED=true`.
5. Run **Test and release extension** from the Actions tab on `main` to verify the connection and submit a new build after the current review finishes.

The publisher job signs a short-lived JWT with the service-account key and exchanges it at Google's OAuth token endpoint for a Chrome Web Store-scoped access token. This avoids granting the service account token-creator permissions on itself or at the project level. The key remains a long-lived credential, so restrict access to the GitHub secret and rotate it if exposed.

`CWS_ENABLED=false` disables Chrome submission. `RELEASE_APPROVED_VERSION` separately controls whether a passing main-branch run creates a GitHub Release at all. A signed-in browser session alone cannot authorize GitHub's hosted runner.

## Failures and review

An upload must finish successfully before submission. A Chrome failure does not remove the GitHub Release. Re-run failed jobs after fixing credentials or a transient failure; already published/submitted versions are detected. If an older version is under review, the job fails clearly without cancelling it. After review finishes, rerun the latest failed job or dispatch a new run on main. Stale versions are rejected. Store updates become available only after Google approves them; this pipeline does not bypass review or edit store descriptions, privacy declarations, or screenshots.

For a rollback, revert the source on main and let CI assign a new, higher version. Do not try to upload an older Chrome version.
