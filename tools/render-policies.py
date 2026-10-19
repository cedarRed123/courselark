#!/usr/bin/env python3
"""Render the bundled Markdown policies into the existing GitHub Pages layouts."""

from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TOKEN = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`")


def inline(value: str) -> str:
    result = []
    start = 0
    for match in TOKEN.finditer(value):
        result.append(escape(value[start:match.start()]))
        label, url, bold, code = match.groups()
        if url:
            result.append(f'<a href="{escape(url, quote=True)}">{escape(label)}</a>')
        elif bold:
            result.append(f'<strong>{escape(bold)}</strong>')
        else:
            result.append(f'<code>{escape(code)}</code>')
        start = match.end()
    result.append(escape(value[start:]))
    return ''.join(result)


def render(markdown: str) -> str:
    blocks = []
    paragraph = []
    listing = []

    def flush():
        if paragraph:
            joined = '\n'.join(paragraph)
            blocks.append('<p>' + '<br>'.join(inline(part.strip()) for part in joined.split('\n')) + '</p>')
            paragraph.clear()
        if listing:
            blocks.append('<ul>\n' + '\n'.join('<li>' + inline(item) + '</li>' for item in listing) + '\n</ul>')
            listing.clear()

    for line in markdown.splitlines():
        if not line.strip():
            flush()
        elif line.startswith('# '):
            flush()
            blocks.append('<h1>' + inline(line[2:]) + '</h1>')
        elif line.startswith('## '):
            flush()
            blocks.append('<h2>' + inline(line[3:]) + '</h2>')
        elif line.startswith('- '):
            if paragraph:
                flush()
            listing.append(line[2:])
        else:
            if listing:
                flush()
            paragraph.append(line)
    flush()
    return '\n'.join(blocks)


for source, target in ((ROOT / 'extension/PRIVACY.md', ROOT / 'privacy/index.html'),
                       (ROOT / 'extension/TERMS.md', ROOT / 'terms/index.html')):
    current = target.read_text()
    rendered = render(source.read_text())
    updated, count = re.subn(r'(?<=<article>).*?(?=</article>)', lambda _: rendered,
                             current, count=1, flags=re.DOTALL)
    if count != 1:
        raise SystemExit(f'Missing article in {target}')
    target.write_text(updated)
