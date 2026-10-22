"""Build a reproducible, runtime-only Chrome Web Store ZIP."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
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
archive = out / f'courselark-{version}.zip'
with TemporaryDirectory() as temporary:
    validated = Path(temporary) / 'validated.zip'
    subprocess.run([sys.executable, str(root / 'tools/package-extension.py'), str(source), str(validated)],
                   check=True, capture_output=True, text=True)
    with zipfile.ZipFile(validated) as checked:
        entries = {name: checked.read(name) for name in checked.namelist()}
entries['manifest.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
checksum = archive.with_suffix('.zip.sha256')
checksum.write_text(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n')
# Firefox build: same files, MV3 background scripts instead of a service worker, plus a Gecko ID.
firefox = dict(manifest, background={'scripts': [manifest['background']['service_worker']], 'type': 'module'},
               browser_specific_settings={'gecko': {'id': 'courselark@cedarred123.github.io', 'strict_min_version': '128.0', 'data_collection_permissions': {'required': ['none']}}})
fx_archive = out / f'courselark-firefox-{version}.zip'
with zipfile.ZipFile(fx_archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for name, data in sorted({**entries, 'manifest.json': (json.dumps(firefox, indent=2) + '\n').encode()}.items()):
        info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
fx_archive.with_suffix('.zip.sha256').write_text(f'{hashlib.sha256(fx_archive.read_bytes()).hexdigest()}  {fx_archive.name}\n')
print(version)
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
        f.write(f'version={version}\narchive={archive.relative_to(root)}\n')
