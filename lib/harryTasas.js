import fetch from 'node-fetch';
import Papa from 'papaparse';

const ES_HEADER = (s) =>
  typeof s === 'string' &&
  (/^\s*DESDE\b/i.test(s) || /^\s*Desde\b/i.test(s));

export async function getRates() {
  const url =
    "https://docs.google.com/spreadsheets/d/1BX7RwrQ4pj97EKoqEYtbcxAvQ66JGYVk_i90waFSV14/export?format=csv&gid=873308939";

  const res = await fetch(url);
  const csvText = await res.text();

  const { data: rows } = Papa.parse(csvText, { header: false });
  const out = {};
  let currentMap = [];

  for (const row of rows) {
    const joined = row.map(x => (x ?? '').toString()).join(' ').toLowerCase();
    if (joined.includes("montos mínimos") || joined.includes("montos minimos"))
      break;

    const nonEmpty = row.some(c => (c ?? '').toString().trim() !== '');
    if (!nonEmpty) continue;

    const headerIndices = [];
    for (let i = 0; i < row.length; i++) {
      if (ES_HEADER(row[i])) headerIndices.push(i);
    }

    if (headerIndices.length > 0) {
      currentMap = [];
      for (const idx of headerIndices) {
        const name = (row[idx] || '').toString().trim();
        const iName = idx;
        const iValue = idx + 1;
        if (!name) continue;
        if (!out[name]) out[name] = {};
        currentMap.push({ name, iName, iValue });
      }
      continue;
    }

    if (currentMap.length > 0) {
      for (const { name, iName, iValue } of currentMap) {
        const destino = row[iName];
        const valor = row[iValue];
        if (destino && valor) {
          out[name][`${destino}`.trim()] = `${valor}`.trim();
        }
      }
    }
  }

  return out;
}