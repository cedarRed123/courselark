# CourseLark

**Free and open source. No CourseLark account, subscription, or paywall.** CourseLark is an independent, local-first Canvas companion for dashboards, assignments, GPA estimates, planning, notes, themes, and study tools. It is an alternative to BetterCampus, with its own code and assets; it is not affiliated with or endorsed by BetterCampus, Canvas/Instructure, or any school. [Feature coverage](extension/FEATURE-COVERAGE.md) documents what is implemented and where it differs.

The complete source code is in [`extension/`](extension/), with setup and development instructions in its [README](extension/README.md).

Download an installable ZIP from [Releases](https://github.com/cedarRed123/open-campus/releases). Each release has a source tag and a corresponding browser-extension ZIP. The original v0.3.1 and v0.3.2 installable ZIPs omitted the root license and policy notices; later automated 0.3.2 builds include the license and third-party notices but still omit the Privacy Policy and Terms. Those documents are available in tagged source. The 0.3.3 candidate corrects the package contents. To load an unpacked extension, use the `extension/` directory at the desired tag. The current [release workflow](RELEASES.md) tests and packages changes merged to `main` and can submit to Chrome; this candidate remains a draft while its release gates are open.

Original project code is offered under [MIT](LICENSE), so you may use, modify, and redistribute that code under its terms. Bundled components retain [separate third-party licenses](extension/THIRD-PARTY.md). The [provenance record](extension/PROVENANCE.md) identifies material and remaining rights-review questions.

The public [Privacy Policy](privacy/) and [Terms](terms/) are hosted from this repository through GitHub Pages.

From the repository root, `python3 tools/package-extension.py extension /path/to/courselark-review.zip` creates a review ZIP, requires the license, policies, and third-party notices, and verifies every packaged file. It refuses to overwrite an existing archive. The automated release packager reuses this validated file list and adds a four-part Chrome version.
