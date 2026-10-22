# Bundled dependencies

- PDF.js (`pdfjs-dist`) 6.4.299, Apache-2.0. `src/vendor/pdf.mjs`, `pdf.worker.mjs` and `standard_fonts/`. Copyright notices and full license are preserved in `PDFJS-LICENSE` and font notice files. Source: https://github.com/mozilla/pdf.js
- fflate 0.8.3, MIT. `src/vendor/fflate.mjs`; its 0.8.3 license notice, including the 2026 copyright attribution, is in `FFLATE-LICENSE`. Source: https://github.com/101arrowz/fflate

Only the browser runtime files needed for document import/rendering are bundled. The extension does not load scripts from CDNs. Dependency audit of the download runtime found zero advisories after updating fflate to 0.8.3 on October 14, 2026. Node/Playwright development tooling is not bundled in the extension.
