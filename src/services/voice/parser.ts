
// parser.ts — robust voice phrase parser for Jet2 FlightOps
// - Flexible time parsing: "20:26", "20 26", "20.26", "2026", "926"
// - Rich synonyms for intents (gate start/end, first/last bus, PRM pickup, walkout)
// - Compact, dependency-free, and hotfix-friendly
//
// Usage:
//   import { parsePhrase } from './parser'
//   const parsed = parsePhrase(rawText)
//   -> { kind:'time', field:'gateEnd', value:'20:19' } | {kind:'flag', field:'walkout', value:true} | {kind:'remark', text:'...'} | undefined

export type Parsed =
  | { kind: 'time'; field: 'gateStart'|'gateEnd'|'firstBus'|'lastBus'|'prmPickup'; value: string }
  | { kind: 'flag'; field: 'walkout'; value: boolean }
  | { kind: 'remark'; text: string }
  | undefined;

/* ------------------------------
 * Utilities
 * ------------------------------ */

// Map word numbers to digits (only what we need for times)
const NUM_WORDS: Record<string, number> = (() => {
  const base: Record<string, number> = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
    seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fifty:50
  };
  // twenty one -> 21 etc. (basic combinator up to 59)
  const out: Record<string, number> = { ...base };
  const tens = ['twenty','thirty','forty','fifty'];
  const ones = ['one','two','three','four','five','six','seven','eight','nine'];
  tens.forEach((t, i) => {
    const tv = (i+2)*10;
    ones.forEach((o, j) => {
      out[`${t} ${o}`] = tv + (j+1);
    });
  });
  return out;
})();

function wordsToDigits(input: string): string {
  // Replace common "twenty twenty-six" styles first
  let s = input;
  // direct matches (longest first)
  const keys = Object.keys(NUM_WORDS).sort((a,b)=>b.length-a.length);
  for (const k of keys) {
    const re = new RegExp(`\\b${k}\\b`, 'g');
    if (re.test(s)) {
      s = s.replace(re, String(NUM_WORDS[k]));
    }
  }
  return s;
}

/**
 * Normalize time tokens within a string.
 * Accepts: "20:26", "20 26", "20.26", "2026", "926"
 * Returns "HH:MM" or null.
 */
export function normalizeTimeTokens(s: string): string | null {
  const cleaned = s
    .toLowerCase()
    .replace(/[^\w: ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const withDigits = wordsToDigits(cleaned);

  // 1) 20:26 or 20 26 or 20.26
  let m = withDigits.match(/\b(\d{1,2})[:\s\.](\d{2})\b/);
  if (m) {
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    if (+hh < 24 && +mm < 60) return `${hh}:${mm}`;
  }

  // 2) 4 digits like 2026 -> 20:26
  m = withDigits.match(/\b(\d{4})\b/);
  if (m) {
    const hh = m[1].slice(0, 2);
    const mm = m[1].slice(2);
    if (+hh < 24 && +mm < 60) return `${hh}:${mm}`;
  }

  // 3) 3 digits like 926 -> 09:26
  m = withDigits.match(/\b(\d{3})\b/);
  if (m) {
    const hh = m[1].slice(0, 1).padStart(2, '0');
    const mm = m[1].slice(1);
    if (+hh < 24 && +mm < 60) return `${hh}:${mm}`;
  }

  return null;
}

/* ------------------------------
 * Intent Synonyms
 * ------------------------------ */

const START_SYNS = [
  'gate start','start gate','gate open','open gate','gate opening','opening gate','gate starter',
  'open flight','flight open','flight opening', 'start' // added
];

const END_SYNS = [
  'gate end','end gate',
  'gate close','close gate','close the gate','closing gate','gate closing','gate closed','closed gate','gate closure',
  'close flight','flight close','flight closed','flight closing', // added
  'great close', 'end', 'finish', 'and'
];

const FIRST_BUS_SYNS = ['first bus','1st bus','bus one','bus 1','first buss'];
const LAST_BUS_SYNS  = ['last bus','final bus','bus last','bus final','end bus'];

const PRM_SYNS = [
  'PRM','prm pickup','ambulift','ambu lift','ambuilift','elevator',
  'maas','wchr','wchs','wchc','dpna', 'i\'m beautiful', 'prm pick up time', 'lift'
];

const WALKOUT_SYNS = [/\\bwalk ?out\\b/, /\\bno bus(es)?\\b/, /\\bwalk to aircraft\\b/, /\\bwalk out to aircraft\\b/];

/* ------------------------------
 * Parsing
 * ------------------------------ */

function hasAny(str: string, list: string[]) {
  return list.some(k => str.includes(k));
}

export function parsePhrase(raw: string): Parsed {
  if (!raw) return undefined;

  const r = raw.toLowerCase().replace(/\s+/g, ' ').trim();

  // remark free text
  if (r.startsWith('remark ')) {
    return { kind: 'remark', text: raw.slice(7).trim() };
  }

  // Walkout flag
  if (WALKOUT_SYNS.some(re => re.test(r))) {
    return { kind: 'flag', field: 'walkout', value: true };
  }

  // Detect intent by synonyms
  let field: Parsed extends { kind:'time'; field: infer F } ? F : never | undefined;

  if (hasAny(r, START_SYNS)) field = 'gateStart' as any;
  else if (hasAny(r, END_SYNS)) field = 'gateEnd' as any;
  else if (hasAny(r, FIRST_BUS_SYNS)) field = 'firstBus' as any;
  else if (hasAny(r, LAST_BUS_SYNS)) field = 'lastBus' as any;
  else if (hasAny(r, PRM_SYNS)) field = 'prmPickup' as any;

  // If we have an intent, try to extract a time from the whole phrase
  if (field) {
    const t = normalizeTimeTokens(r);
    if (t) return { kind: 'time', field: field as any, value: t };
  }

  // If no explicit synonyms found, attempt "implicit" patterns like:
  //  - "gate 20:26 open" or "close gate at 2026"
  //  - "first bus 20:30"
  const implicitMatchers: Array<{ re: RegExp; field: 'gateStart'|'gateEnd'|'firstBus'|'lastBus'|'prmPickup' }> = [
    // gate-based
    { re: /\bgate\s*(?:open|opening|start)\b/,                    field: 'gateStart' },
    { re: /\bgate\s*(?:close|closing|closed|end|ending|closure)\b/, field: 'gateEnd' },

    // flight-based (new)
    { re: /\b(?:open|opening)\s+flight\b/,                        field: 'gateStart' },
    { re: /\bflight\s*(?:open|opening)\b/,                        field: 'gateStart' },
    { re: /\b(?:close|closing|closed|closure)\s+flight\b/,        field: 'gateEnd' },
    { re: /\bflight\s*(?:close|closing|closed|closure)\b/,        field: 'gateEnd' },

    // buses & PRM
    { re: /\bfirst\s*bus\b/,                                      field: 'firstBus' },
    { re: /\blast\s*bus\b/,                                       field: 'lastBus' },
    { re: /\bprm(?:\s*pickup)?\b/,                                field: 'prmPickup' },
    { re: /\bprm(?:\s*lift)?\b/,                                field: 'prmPickup' },
  ];

  for (const m of implicitMatchers) {
    if (m.re.test(r)) {
      const t = normalizeTimeTokens(r);
      if (t) return { kind: 'time', field: m.field, value: t };
    }
  }

  return undefined;
}

// Export synonyms for unit tests / diagnostics
export const __debug = { START_SYNS, END_SYNS, FIRST_BUS_SYNS, LAST_BUS_SYNS, PRM_SYNS };
