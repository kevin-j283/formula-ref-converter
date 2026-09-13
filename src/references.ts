/**
 * Parsing and formatting for single-cell references in the two notations
 * spreadsheets use inside formulas:
 *
 *   A1 style:    optional $ before the column letters, optional $ before the
 *                row number, e.g. A1, $A1, A$1, $A$1
 *   R1C1 style:  R and C followed by either a bare number (absolute) or a
 *                bracketed offset from an anchor cell (relative),
 *                e.g. R1C1, RC, R[1]C[-2], R5C[3]
 *
 * A CellRef always stores the absolute row/column position plus whether each
 * axis was written as absolute or relative in its source notation. That is
 * enough information to render the same reference in either notation.
 */

export interface Anchor {
  row: number
  col: number
}

export interface CellRef {
  row: number
  col: number
  rowAbsolute: boolean
  colAbsolute: boolean
}

// A range is just its two corners. Which corner is "start" vs "end" is
// whatever order they appeared in the formula - we don't normalize
// top-left/bottom-right the way a spreadsheet engine evaluating the range
// would, since that's not needed to translate notations.
export interface RangeRef {
  start: CellRef
  end: CellRef
}

// Excel's rightmost column is XFD, three letters, so real spreadsheets never
// need more than that. Capping the pattern here keeps it from swallowing
// ordinary words like "CAT1" as if they were column references.
const A1_REF = /^(\$)?([A-Za-z]{1,3})(\$)?(\d+)$/
const R1C1_REF = /^R(?:(\[-?\d+\])|(\d+))?C(?:(\[-?\d+\])|(\d+))?$/

export function columnLetterToNumber(letters: string): number {
  let result = 0
  for (const char of letters.toUpperCase()) {
    const value = char.charCodeAt(0) - 64 // 'A' -> 1
    if (value < 1 || value > 26) {
      throw new Error(`not a column letter: ${char}`)
    }
    result = result * 26 + value
  }
  return result
}

export function columnNumberToLetter(num: number): string {
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`column number must be a positive integer, got ${num}`)
  }
  let n = num
  let letters = ''
  while (n > 0) {
    const remainder = (n - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}

export function parseA1CellRef(text: string): CellRef | null {
  const match = A1_REF.exec(text)
  if (!match) return null
  const [, colDollar, letters, rowDollar, digits] = match
  return {
    col: columnLetterToNumber(letters as string),
    row: Number(digits),
    colAbsolute: colDollar === '$',
    rowAbsolute: rowDollar === '$',
  }
}

export function formatA1CellRef(ref: CellRef): string {
  const col = (ref.colAbsolute ? '$' : '') + columnNumberToLetter(ref.col)
  const row = (ref.rowAbsolute ? '$' : '') + String(ref.row)
  return col + row
}

export function parseR1C1CellRef(text: string, anchor: Anchor): CellRef | null {
  const match = R1C1_REF.exec(text)
  if (!match) return null
  const [, rowBracket, rowAbs, colBracket, colAbs] = match

  const rowAbsolute = rowAbs !== undefined
  const colAbsolute = colAbs !== undefined

  const row = rowAbsolute
    ? Number(rowAbs)
    : anchor.row + (rowBracket !== undefined ? Number(rowBracket.slice(1, -1)) : 0)
  const col = colAbsolute
    ? Number(colAbs)
    : anchor.col + (colBracket !== undefined ? Number(colBracket.slice(1, -1)) : 0)

  return { row, col, rowAbsolute, colAbsolute }
}

export function formatR1C1CellRef(ref: CellRef, anchor: Anchor): string {
  const rowPart = ref.rowAbsolute
    ? String(ref.row)
    : ref.row === anchor.row
      ? ''
      : `[${ref.row - anchor.row}]`
  const colPart = ref.colAbsolute
    ? String(ref.col)
    : ref.col === anchor.col
      ? ''
      : `[${ref.col - anchor.col}]`
  return `R${rowPart}C${colPart}`
}

export function parseA1Range(text: string): RangeRef | null {
  const separator = text.indexOf(':')
  if (separator === -1) return null
  const start = parseA1CellRef(text.slice(0, separator))
  const end = parseA1CellRef(text.slice(separator + 1))
  if (!start || !end) return null
  return { start, end }
}

export function formatA1Range(range: RangeRef): string {
  return `${formatA1CellRef(range.start)}:${formatA1CellRef(range.end)}`
}

export function parseR1C1Range(text: string, anchor: Anchor): RangeRef | null {
  const separator = text.indexOf(':')
  if (separator === -1) return null
  const start = parseR1C1CellRef(text.slice(0, separator), anchor)
  const end = parseR1C1CellRef(text.slice(separator + 1), anchor)
  if (!start || !end) return null
  return { start, end }
}

export function formatR1C1Range(range: RangeRef, anchor: Anchor): string {
  return `${formatR1C1CellRef(range.start, anchor)}:${formatR1C1CellRef(range.end, anchor)}`
}
