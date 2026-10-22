"""Build a reproducible, runtime-only Chrome Web Store ZIP."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'extension'
manifest = json.loads((source / 'manifest.json').read_text())
base = manifest['version']
if not re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', base):
    raise SystemExit('Source manifest version must have three numeric components')
build = int(sys.argv[1])
if not 1 <= build <= 65535 or any(int(n) > 65535 for n in base.split('.')):
    raise SystemExit('Chrome version components must fit 0..65535; build must be positive')
version = f'{base}.{build}'
manifest['version'] = version
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'open-campus-{version}.zip'
files = [source / name for name in ('index.html', 'popup.html', 'LICENSE', 'THIRD-PARTY.md', 'PRIVACY.md', 'TERMS.md', 'README.md', 'FEATURE-COVERAGE.md')]
files += sorted(p for folder in ('src', 'icons') for p in (source / folder).rglob('*') if p.is_file() and not p.name.startswith('.'))
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    entries = {'manifest.json': (json.dumps(manifest, indent=2) + '\n').encode()}
    entries.update({p.relative_to(source).as_posix(): p.read_bytes() for p in files})
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
checksum = archive.with_suffix('.zip.sha256')
checksum.write_text(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n')
print(version)
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
        f.write(f'version={version}\narchive={archive.relative_to(root)}\n')
