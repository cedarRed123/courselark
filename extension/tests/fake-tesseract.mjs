#!/usr/bin/env node
// Test stand-in for the tesseract CLI: writes "<output>.txt" naming the language it was given.
import {writeFileSync, readFileSync} from 'node:fs';
const [input, output, , lang] = process.argv.slice(2);
writeFileSync(output + '.txt', `OCR ${lang} ${readFileSync(input).length} bytes`);
