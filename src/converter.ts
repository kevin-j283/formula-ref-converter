import {
  type Anchor,
  formatA1CellRef,
  formatR1C1CellRef,
  parseA1CellRef,
  parseR1C1CellRef,
} from './references.js'

// Matches either a quoted string literal (left untouched) or a bare A1 cell
// reference. The lookbehind/lookahead keep it from matching the middle of a
// longer identifier or function name, e.g. the "A1" inside "MYCELLA1" or the
// digits in "LOG10(" when followed directly by an open paren.
const A1_TOKEN = /"(?:[^"]|"")*"|(?<![A-Za-z0-9_$])\$?[A-Za-z]{1,3}\$?\d+(?![A-Za-z0-9_(])/g

// Same idea for R1C1 references. Requiring a non-word boundary on both sides
// stops it from matching the "RC" inside words like "SEARCH".
const R1C1_TOKEN =
  /"(?:[^"]|"")*"|(?<![A-Za-z0-9_])R(?:\[-?\d+\]|\d+)?C(?:\[-?\d+\]|\d+)?(?![A-Za-z0-9_])/g

/**
 * Rewrites every A1-style cell reference in a formula to the equivalent
 * R1C1-style reference, relative to the given anchor cell. Text inside
 * double-quoted string literals is passed through unchanged. Anything in
 * the formula that is not a recognized reference (function names, numbers,
 * operators, sheet names) is also left as-is.
 */
export function convertFormulaA1ToR1C1(formula: string, anchor: Anchor): string {
  return formula.replace(A1_TOKEN, (token) => {
    if (token.startsWith('"')) return token
    const ref = parseA1CellRef(token)
    if (!ref) return token
    return formatR1C1CellRef(ref, anchor)
  })
}

/**
 * Rewrites every R1C1-style cell reference in a formula to the equivalent
 * A1-style reference, resolving relative offsets against the given anchor
 * cell. Same string-literal and pass-through behavior as
 * convertFormulaA1ToR1C1.
 */
export function convertFormulaR1C1ToA1(formula: string, anchor: Anchor): string {
  return formula.replace(R1C1_TOKEN, (token) => {
    if (token.startsWith('"')) return token
    const ref = parseR1C1CellRef(token, anchor)
    if (!ref) return token
    return formatA1CellRef(ref)
  })
}
