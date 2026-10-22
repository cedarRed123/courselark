#!/usr/bin/env python3
"""Package CourseLark runtime and legal notices; does not establish legal clearance.

Usage: python3 tools/package-extension.py EXTENSION_SOURCE OUTPUT_ZIP
Only the explicit runtime directories and legal documents below are included.
"""

from pathlib import Path
import argparse
import hashlib
import json
import re
from zipfile import ZIP_DEFLATED, ZipFile


def package(source: Path, destination: Path) -> dict:
    source = source.resolve(strict=True)
    destination = destination.resolve()
    required = [
        "manifest.json", "index.html", "popup.html", "legal/privacy.html", "legal/terms.html",
        "LICENSE", "PRIVACY.md", "TERMS.md", "THIRD-PARTY.md",
        "src/app.css", "src/app.js", "src/background.js", "src/content.js",
        "src/core.js", "src/games.js", "src/popup.js", "src/store.js",
        "src/vendor/FFLATE-LICENSE", "src/vendor/PDFJS-LICENSE",
        "src/vendor/standard_fonts/LICENSE_FOXIT",
        "src/vendor/standard_fonts/LICENSE_LIBERATION",
        "icons/icon.png", "icons/icon.svg",
    ]
    for name in required:
        path = source / name
        if not path.is_file() or path.is_symlink() or not path.stat().st_size:
            raise ValueError(f"Required file missing, empty or symbolic: {name}")
    manifest = json.loads((source / "manifest.json").read_text())
    package_json = json.loads((source / "package.json").read_text())
    if manifest["version"] != package_json["version"]:
        raise ValueError("Manifest and package.json versions differ")
    core = (source / "src/core.js").read_text()
    match = re.search(r"export const legalVersion = '([^']+)'", core)
    if not match:
        raise ValueError("Cannot find the extension Terms version")
    terms_version = match.group(1)
    for name, marker in (("TERMS.md", "**Version:** "), ("legal/terms.html", "<strong>Version:</strong> ")):
        if marker + terms_version not in (source / name).read_text():
            raise ValueError(f"{name} does not match the extension Terms version")
    files = {source / name for name in required}
    # Explicitly retain runtime code, vendored modules, fonts and notices.
    for directory in ("src", "icons"):
        for path in (source / directory).rglob("*"):
            if path.is_symlink():
                raise ValueError(f"Symbolic path not permitted: {path}")
            if path.is_file():
                relative = path.relative_to(source)
                if any(part.startswith(".") or part == "node_modules" for part in relative.parts):
                    raise ValueError(f"Unexpected hidden/dependency runtime file: {relative}")
                if path.suffix.lower() not in {".js", ".mjs", ".css", ".png", ".svg", ".ttf", ".pfb"} and not path.name.startswith("LICENSE") and not path.name.endswith("-LICENSE"):
                    raise ValueError(f"Unexpected runtime file; review before shipping: {relative}")
                files.add(path)
    for name in [manifest["background"]["service_worker"], manifest["action"]["default_popup"], manifest["options_page"], *manifest.get("icons", {}).values()]:
        if source / name not in files:
            raise ValueError(f"Manifest entry missing from package: {name}")
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite an existing artifact: {destination}")
    if destination == source or source in destination.parents:
        raise ValueError("Write the archive outside the source directory")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, "x", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        archive.comment = b"CourseLark extension. See included legal notices."
        for path in sorted(files):
            archive.write(path, path.relative_to(source).as_posix())
    expected = {path.relative_to(source).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in files}
    with ZipFile(destination) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(expected):
            raise ValueError("Archive validation failed")
        for name, digest in expected.items():
            if hashlib.sha256(archive.read(name)).hexdigest() != digest:
                raise ValueError(f"Packaged file differs from source: {name}")
    return {"version": manifest["version"], "files": len(expected), "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(), "archive": str(destination), "legal_clearance": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    arguments = parser.parse_args()
    print(json.dumps(package(arguments.source, arguments.destination), indent=2))
