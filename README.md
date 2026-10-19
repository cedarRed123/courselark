# Open Campus

**Free and open source. No Open Campus account, subscription, or paywall.** Open Campus is an independent, local-first Canvas companion for dashboards, assignments, GPA estimates, planning, notes, themes, and study tools. It is an alternative to BetterCampus, with its own code and assets; it is not affiliated with or endorsed by BetterCampus, Canvas/Instructure, or any school. [Feature coverage](extension/FEATURE-COVERAGE.md) documents what is implemented and where it differs.

The complete source code is in [`extension/`](extension/), with setup and development instructions in its [README](extension/README.md).

Download an installable ZIP from [Releases](https://github.com/cedarRed123/open-campus/releases). Each release has a source tag and a corresponding browser-extension ZIP. The v0.3.1 and v0.3.2 installable ZIPs omitted the root license and legal notices; those files are available in the tagged source, and the packaging process is being corrected for the next release. To load an unpacked extension, use the `extension/` directory at the desired tag. Changes to the source require repackaging before installation.

Original project code is offered under [MIT](LICENSE), so you may use, modify, and redistribute that code under its terms. Bundled components retain [separate third-party licenses](extension/THIRD-PARTY.md). The [provenance record](extension/PROVENANCE.md) identifies material and remaining rights-review questions.

The public [Privacy Policy](privacy/) and [Terms](terms/) are hosted from this repository through GitHub Pages.

From the repository root, `python3 tools/package-extension.py extension /path/to/open-campus-version.zip` creates a new installable ZIP, requires the license/privacy/terms/third-party notices, and verifies every packaged file. It refuses to overwrite an existing archive.
