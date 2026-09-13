import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  columnLetterToNumber,
  columnNumberToLetter,
  formatA1CellRef,
  formatA1Range,
  formatR1C1CellRef,
  formatR1C1Range,
  parseA1CellRef,
  parseA1Range,
  parseR1C1CellRef,
  parseR1C1Range,
} from './references.js'

test('columnLetterToNumber converts single and multi-letter columns', () => {
  assert.equal(columnLetterToNumber('A'), 1)
  assert.equal(columnLetterToNumber('Z'), 26)
  assert.equal(columnLetterToNumber('AA'), 27)
  assert.equal(columnLetterToNumber('AZ'), 52)
  assert.equal(columnLetterToNumber('BA'), 53)
  assert.equal(columnLetterToNumber('ZZ'), 702)
  assert.equal(columnLetterToNumber('AAA'), 703)
})

test('columnLetterToNumber is case-insensitive', () => {
  assert.equal(columnLetterToNumber('a'), 1)
  assert.equal(columnLetterToNumber('aZ'), 52)
})

test('columnLetterToNumber rejects non-letters', () => {
  assert.throws(() => columnLetterToNumber('A1'))
  assert.throws(() => columnLetterToNumber('$'))
})

test('columnNumberToLetter is the inverse of columnLetterToNumber', () => {
  for (const n of [1, 26, 27, 52, 53, 702, 703, 16384]) {
    assert.equal(columnLetterToNumber(columnNumberToLetter(n)), n)
  }
})

test('columnNumberToLetter rejects non-positive or non-integer input', () => {
  assert.throws(() => columnNumberToLetter(0))
  assert.throws(() => columnNumberToLetter(-1))
  assert.throws(() => columnNumberToLetter(1.5))
})

test('parseA1CellRef handles all four combinations of absolute markers', () => {
  assert.deepEqual(parseA1CellRef('A1'), { row: 1, col: 1, rowAbsolute: false, colAbsolute: false })
  assert.deepEqual(parseA1CellRef('$A1'), { row: 1, col: 1, rowAbsolute: false, colAbsolute: true })
  assert.deepEqual(parseA1CellRef('A$1'), { row: 1, col: 1, rowAbsolute: true, colAbsolute: false })
  assert.deepEqual(parseA1CellRef('$A$1'), { row: 1, col: 1, rowAbsolute: true, colAbsolute: true })
})

test('parseA1CellRef handles multi-letter columns and multi-digit rows', () => {
  assert.deepEqual(parseA1CellRef('AZ123'), { row: 123, col: 52, rowAbsolute: false, colAbsolute: false })
})

test('parseA1CellRef rejects malformed or out-of-shape input', () => {
  assert.equal(parseA1CellRef(''), null)
  assert.equal(parseA1CellRef('1A'), null)
  assert.equal(parseA1CellRef('A'), null)
  assert.equal(parseA1CellRef('1'), null)
  assert.equal(parseA1CellRef('ABCD1'), null)
  assert.equal(parseA1CellRef('A1A'), null)
})

test('formatA1CellRef round-trips through parseA1CellRef', () => {
  for (const text of ['A1', '$A1', 'A$1', '$A$1', 'AZ123']) {
    assert.equal(formatA1CellRef(parseA1CellRef(text)!), text)
  }
})

test('parseR1C1CellRef resolves relative offsets against the anchor', () => {
  const anchor = { row: 3, col: 3 }
  assert.deepEqual(parseR1C1CellRef('RC', anchor), { row: 3, col: 3, rowAbsolute: false, colAbsolute: false })
  assert.deepEqual(parseR1C1CellRef('R[1]C[-2]', anchor), {
    row: 4,
    col: 1,
    rowAbsolute: false,
    colAbsolute: false,
  })
  assert.deepEqual(parseR1C1CellRef('R[0]C[0]', anchor), {
    row: 3,
    col: 3,
    rowAbsolute: false,
    colAbsolute: false,
  })
})

test('parseR1C1CellRef treats bare numbers as absolute', () => {
  const anchor = { row: 3, col: 3 }
  assert.deepEqual(parseR1C1CellRef('R1C1', anchor), { row: 1, col: 1, rowAbsolute: true, colAbsolute: true })
  assert.deepEqual(parseR1C1CellRef('R5C[3]', anchor), {
    row: 5,
    col: 6,
    rowAbsolute: true,
    colAbsolute: false,
  })
})

test('parseR1C1CellRef rejects malformed input', () => {
  const anchor = { row: 3, col: 3 }
  assert.equal(parseR1C1CellRef('', anchor), null)
  assert.equal(parseR1C1CellRef('A1', anchor), null)
  assert.equal(parseR1C1CellRef('RC1C1', anchor), null)
  assert.equal(parseR1C1CellRef('R[1]C[', anchor), null)
})

test('formatR1C1CellRef omits axes that equal the anchor', () => {
  const anchor = { row: 3, col: 3 }
  assert.equal(formatR1C1CellRef({ row: 3, col: 3, rowAbsolute: false, colAbsolute: false }, anchor), 'RC')
  assert.equal(
    formatR1C1CellRef({ row: 4, col: 1, rowAbsolute: false, colAbsolute: false }, anchor),
    'R[1]C[-2]',
  )
})

test('formatR1C1CellRef writes absolute axes as bare numbers regardless of anchor', () => {
  const anchor = { row: 3, col: 3 }
  assert.equal(formatR1C1CellRef({ row: 3, col: 3, rowAbsolute: true, colAbsolute: true }, anchor), 'R3C3')
})

test('parseA1Range parses both corners', () => {
  assert.deepEqual(parseA1Range('A1:B2'), {
    start: { row: 1, col: 1, rowAbsolute: false, colAbsolute: false },
    end: { row: 2, col: 2, rowAbsolute: false, colAbsolute: false },
  })
  assert.deepEqual(parseA1Range('$A$1:B2'), {
    start: { row: 1, col: 1, rowAbsolute: true, colAbsolute: true },
    end: { row: 2, col: 2, rowAbsolute: false, colAbsolute: false },
  })
})

test('parseA1Range rejects malformed ranges', () => {
  assert.equal(parseA1Range('A1'), null)
  assert.equal(parseA1Range('A1:'), null)
  assert.equal(parseA1Range(':A1'), null)
  assert.equal(parseA1Range('A1:B2:C3'), null)
})

test('formatA1Range round-trips through parseA1Range', () => {
  for (const text of ['A1:B2', '$A$1:$B$2', 'A1:A1']) {
    assert.equal(formatA1Range(parseA1Range(text)!), text)
  }
})

test('parseR1C1Range resolves both corners against the anchor', () => {
  const anchor = { row: 3, col: 3 }
  assert.deepEqual(parseR1C1Range('RC:R[1]C[1]', anchor), {
    start: { row: 3, col: 3, rowAbsolute: false, colAbsolute: false },
    end: { row: 4, col: 4, rowAbsolute: false, colAbsolute: false },
  })
})

test('parseR1C1Range rejects malformed ranges', () => {
  const anchor = { row: 3, col: 3 }
  assert.equal(parseR1C1Range('RC', anchor), null)
  assert.equal(parseR1C1Range('RC:', anchor), null)
  assert.equal(parseR1C1Range('RC:R1C1:R2C2', anchor), null)
})

test('formatR1C1Range omits axes that equal the anchor, per corner', () => {
  const anchor = { row: 3, col: 3 }
  assert.equal(
    formatR1C1Range(
      {
        start: { row: 3, col: 3, rowAbsolute: false, colAbsolute: false },
        end: { row: 4, col: 4, rowAbsolute: false, colAbsolute: false },
      },
      anchor,
    ),
    'RC:R[1]C[1]',
  )
})
