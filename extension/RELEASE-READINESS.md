# 0.3.3 review status (October 19, 2026)

This is a release-candidate checklist, not a legal clearance or a certification of compliance.

| Audit concern | Current status | Evidence / next gate |
| --- | --- | --- |
| Missing MIT and legal notices in installable ZIP | Fixed in candidate package | `tools/package-extension.py` requires `LICENSE`, `PRIVACY.md`, `TERMS.md`, `THIRD-PARTY.md` and checks archived bytes. The public v0.3.1/v0.3.2 ZIPs remain unchanged; their release notes now explain the omission. |
| AI described as strictly local | Disclosure corrected | UI, Privacy, Terms, README, and store draft say configured Ollama may use cloud models. Note content requires per-action confirmation. Local-only mode is **not** verified or enforced. |
| Local companion accepts any extension origin | Pairing added in candidate | AI and transcription POST requests now require a 64-character pairing code. It is generated at companion startup, entered in Settings, stored outside JSON backups, and cleared with local data. Browser and server checks cover rejection without it; configured Ollama/Whisper processing remains unverified. |
| Reminders described as opt-in | Fixed for new installations | `initial().settings.reminders` is false. Existing settings retain the user's choice. |
| Orphaned attachments after backup restore | Fixed in candidate | Import drops unavailable attachment references and removes unreferenced IndexedDB blobs after storing restored JSON. Real extension smoke covers the workflow. |
| Local erasure | Added | Settings has an erase control for this browser origin. Real extension smoke checks JSON state and IndexedDB. Standalone data in another origin and exported copies need separate deletion. |
| Terms assent and legal access | Added | Dashboard and popup show the core data-handling summary, link Terms/Privacy, and store the accepted version locally. LMS import/registration is gated. The Web Store still needs its own accurate pre-installation disclosure. This is not parental authorization. |
| Support and recording disclosures | Drafted | Privacy names email, public issues, and no automatic support deletion schedule. UI and Terms warn about recording permissions. Operator confirmed support email and public issue content remain until manually deleted, with no automatic schedule. |
| Source/license provenance | Partially documented | `PROVENANCE.md` identifies bundled material and outstanding rights review. All 21 bundled vendor files/notices now match installed upstream versions after correcting fflate's copyright year. The bird icon has reproducible SVG source and a visual comparison with the older Better Canvas icon. Limited lexical comparison is not copyright clearance, and contributor rights remain unverified. |
| Product name | Working replacement | The candidate uses CourseLark in product-facing text. A quick exact-name search is not comprehensive trademark clearance; obtain clearance before a public rename. The old GitHub Pages URLs remain because the current store listing may use them. |
| Intended under-13 K–12 use | Unresolved | No parent/school authorization workflow or child-specific optional-transfer controls. Determine legal applicability and product design with qualified counsel before serving this audience through a new release. |
| Submitted Chrome Web Store declarations | Mapping prepared; live selections unverified | `STORE-DATA-MAP.md` maps code paths, data categories, permissions, optional recipients and declaration questions to the current candidate. Compare it with the actual dashboard selections, uploaded ZIP and live policy. The prior dashboard access denial remains a blocker to verification; do not bypass it. |
| Terms limitations and school/recording law | Needs qualified review | Do not assume the disclaimer, consent screen, or MIT notice removes statutory, contract, or school obligations. |

The candidate has not been uploaded to the Chrome Web Store or published as a new GitHub release. Retain manual store publication until the unresolved gates are addressed and the exact uploaded ZIP is verified.
