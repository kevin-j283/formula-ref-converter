import {
  type Anchor,
  formatA1CellRef,
  formatA1Range,
  formatR1C1CellRef,
  formatR1C1Range,
  parseA1CellRef,
  parseA1Range,
  parseR1C1CellRef,
  parseR1C1Range,
} from './references.js'

const A1_CELL = String.raw`\$?[A-Za-z]{1,3}\$?\d+`
const R1C1_CELL = String.raw`R(?:\[-?\d+\]|\d+)?C(?:\[-?\d+\]|\d+)?`

// Matches either a quoted string literal (left untouched) or a bare A1 cell
// reference, optionally paired with a second one across a colon to form a
// range (e.g. A1:B2). The lookbehind/lookahead keep it from matching the
// middle of a longer identifier or function name, e.g. the "A1" inside
// "MYCELLA1" or the digits in "LOG10(" when followed directly by an open
// paren.
const A1_TOKEN = new RegExp(
  String.raw`"(?:[^"]|"")*"|(?<![A-Za-z0-9_$])${A1_CELL}(?::${A1_CELL})?(?![A-Za-z0-9_(])`,
  'g',
)

// Same idea for R1C1 references. Requiring a non-word boundary on both sides
// stops it from matching the "RC" inside words like "SEARCH".
const R1C1_TOKEN = new RegExp(
  String.raw`"(?:[^"]|"")*"|(?<![A-Za-z0-9_])${R1C1_CELL}(?::${R1C1_CELL})?(?![A-Za-z0-9_])`,
  'g',
)

/**
 * Rewrites every A1-style cell reference or range in a formula to the
 * equivalent R1C1-style notation, relative to the given anchor cell. Text
 * inside double-quoted string literals is passed through unchanged.
 * Anything in the formula that is not a recognized reference (function
 * names, numbers, operators, sheet names) is also left as-is.
 */
export function convertFormulaA1ToR1C1(formula: string, anchor: Anchor): string {
  return formula.replace(A1_TOKEN, (token) => {
    if (token.startsWith('"')) return token
    if (token.includes(':')) {
      const range = parseA1Range(token)
      return range ? formatR1C1Range(range, anchor) : token
    }
    const ref = parseA1CellRef(token)
    return ref ? formatR1C1CellRef(ref, anchor) : token
  })
}

/**
 * Rewrites every R1C1-style cell reference or range in a formula to the
 * equivalent A1-style notation, resolving relative offsets against the
 * given anchor cell. Same string-literal and pass-through behavior as
 * convertFormulaA1ToR1C1.
 */
export function convertFormulaR1C1ToA1(formula: string, anchor: Anchor): string {
  return formula.replace(R1C1_TOKEN, (token) => {
    if (token.startsWith('"')) return token
    if (token.includes(':')) {
      const range = parseR1C1Range(token, anchor)
      return range ? formatA1Range(range) : token
    }
    const ref = parseR1C1CellRef(token, anchor)
    return ref ? formatA1CellRef(ref) : token
  })
}
