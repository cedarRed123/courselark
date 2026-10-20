#!/usr/bin/env python3
"""Compare bundled runtime files and notices with installed upstream packages.

Example: python3 tools/verify-vendor.py --pdfjs-dir /path/to/pdfjs-dist --fflate-dir /path/to/fflate
"""

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "extension/src/vendor"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_pair(bundled: Path, upstream: Path) -> dict:
    if not bundled.is_file() or not upstream.is_file():
        raise FileNotFoundError(f"Missing vendor pair: {bundled} / {upstream}")
    bundled_hash, upstream_hash = digest(bundled), digest(upstream)
    if bundled_hash != upstream_hash:
        raise ValueError(f"Bundled file differs from upstream: {bundled.relative_to(ROOT)}")
    return {"file": str(bundled.relative_to(ROOT)), "sha256": bundled_hash}


def main(pdfjs: Path, fflate: Path) -> dict:
    pdf_version = json.loads((pdfjs / "package.json").read_text())["version"]
    fflate_version = json.loads((fflate / "package.json").read_text())["version"]
    if pdf_version != "6.4.299" or fflate_version != "0.8.3":
        raise ValueError(f"Unexpected versions: pdfjs-dist {pdf_version}, fflate {fflate_version}")
    pairs = [
        (VENDOR / "pdf.mjs", pdfjs / "build/pdf.mjs"),
        (VENDOR / "pdf.worker.mjs", pdfjs / "build/pdf.worker.mjs"),
        (VENDOR / "PDFJS-LICENSE", pdfjs / "LICENSE"),
        (VENDOR / "fflate.mjs", fflate / "esm/browser.js"),
        (VENDOR / "FFLATE-LICENSE", fflate / "LICENSE"),
    ]
    fonts = sorted((VENDOR / "standard_fonts").iterdir())
    if not fonts:
        raise ValueError("No bundled PDF standard fonts found")
    pairs.extend((path, pdfjs / "standard_fonts" / path.name) for path in fonts)
    return {"pdfjs_dist": pdf_version, "fflate": fflate_version,
            "verified": [verify_pair(*pair) for pair in pairs]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdfjs-dir", type=Path, required=True)
    parser.add_argument("--fflate-dir", type=Path, required=True)
    arguments = parser.parse_args()
    print(json.dumps(main(arguments.pdfjs_dir, arguments.fflate_dir), indent=2))
