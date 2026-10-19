# CourseLark source and asset provenance record

This inventory records what is bundled and what still needs a rights review. It does not prove independent authorship or legal clearance.

| Material | Present source | Current attribution / license basis | Remaining check |
| --- | --- | --- | --- |
| CourseLark application and companion (formerly Open Campus) (`src/app.js`, `background.js`, `content.js`, `core.js`, `store.js`, `games.js`, `server.mjs`, HTML/CSS) | This repository's `extension/` directory | Project presents these files as original project work under `LICENSE` (MIT) | Confirm every contributor authorized MIT publication and review nonliteral similarity to reference products |
| CourseLark icon (`icons/icon.png`) | This repository | Project presents it as an original asset under MIT | Retain source/design history and confirm rights to every element |
| PDF.js (`src/vendor/pdf.mjs`, `pdf.worker.mjs`) | Bundled vendor copy | Apache 2.0 notice in `src/vendor/PDFJS-LICENSE` and `THIRD-PARTY.md` | Preserve upstream license and any required notices in each package |
| fflate (`src/vendor/fflate.mjs`) | Bundled vendor copy | MIT notice in `src/vendor/FFLATE-LICENSE` and `THIRD-PARTY.md` | Preserve upstream notice in each package |
| PDF standard fonts (`src/vendor/standard_fonts/`) | Bundled vendor fonts | `LICENSE_FOXIT`, `LICENSE_LIBERATION`, and `THIRD-PARTY.md` | Preserve notices in each package |

`REA-FINDINGS.md` documents inspection of the older Better Canvas repository at commit `c7d8bad4e6c2c10589f07e4497e0080a8cc2825a` (AGPL v3). That reference code is not listed among bundled files. A limited lexical comparison reported no identical original files and no exact runs of 35 or more tokens in compared application JS/CSS/HTML. The comparison cannot resolve adapted expression, visual similarity, contractual duties, or ownership. A reviewer should examine any reuse before treating the MIT declaration as cleared.

The package script in `../tools/package-extension.py` includes CourseLark runtime files and all listed notices. For future releases, record the package SHA-256, upstream dependency versions, contributor permissions, and results of the rights review alongside the release candidate.
