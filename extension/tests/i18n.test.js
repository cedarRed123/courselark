import test from 'node:test';
import assert from 'node:assert/strict';
import {languages, language, translateText} from '../src/i18n.js';

test('every offered language translates every interface string and falls back to English', () => {
  const codes = languages.map(([code]) => code).filter(c => !['auto', 'en'].includes(c));
  assert.deepEqual(codes, ['es', 'fr', 'pt']);
  for (const key of ['Overview', 'Settings', 'Enable on this site', 'Export annotated PDF', 'Tab icon'])
    for (const code of codes) assert.notEqual(translateText(key, code), key, `${code}: ${key}`);
  assert.equal(language('auto', 'pt-BR'), 'pt'); assert.equal(language('auto', 'de-DE'), 'en'); assert.equal(language('fr'), 'fr');
});
