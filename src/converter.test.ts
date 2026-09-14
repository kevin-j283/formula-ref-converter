import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convertFormulaA1ToR1C1, convertFormulaR1C1ToA1 } from './converter.js'

const anchor = { row: 3, col: 3 } // formula lives in C3
const identityAnchor = { row: 1, col: 1 } // formula lives in A1, so RC === A1

test('convertFormulaA1ToR1C1 converts a mix of relative and absolute refs', () => {
  assert.equal(convertFormulaA1ToR1C1('=SUM(A1:A10)+$B$1', anchor), '=SUM(R[-2]C[-2]:R[7]C[-2])+R1C2')
})

test('convertFormulaR1C1ToA1 converts a mix of relative and absolute refs', () => {
  assert.equal(convertFormulaR1C1ToA1('=R[-2]C[-2]+R1C2', anchor), '=A1+B1')
})

test('convertFormulaA1ToR1C1 leaves string literals untouched', () => {
  assert.equal(
    convertFormulaA1ToR1C1('=IF(A1="A1",A1,B2)', identityAnchor),
    '=IF(RC="A1",RC,R[1]C[1])',
  )
})

test('convertFormulaR1C1ToA1 leaves string literals untouched', () => {
  assert.equal(
    convertFormulaR1C1ToA1('=IF(RC="RC",RC,R2C2)', identityAnchor),
    '=IF(A1="RC",A1,B2)',
  )
})

test('convertFormulaA1ToR1C1 does not mangle function names or identifiers', () => {
  assert.equal(
    convertFormulaA1ToR1C1('=LOG10(A1)+MYCELLA1', identityAnchor),
    '=LOG10(RC)+MYCELLA1',
  )
})

test('convertFormulaR1C1ToA1 does not mangle words that contain RC', () => {
  assert.equal(convertFormulaR1C1ToA1('=SEARCH("x",R1C1)', anchor), '=SEARCH("x",A1)')
})

test('convertFormulaR1C1ToA1 converts a range', () => {
  assert.equal(convertFormulaR1C1ToA1('=SUM(R[-2]C[-2]:R[7]C[-2])', anchor), '=SUM(A1:A10)')
})

test('range conversion round-trips both directions', () => {
  assert.equal(
    convertFormulaR1C1ToA1(convertFormulaA1ToR1C1('=SUM(A1:B10)', anchor), anchor),
    '=SUM(A1:B10)',
  )
})

test('conversion is a no-op round trip for a formula with no references', () => {
  assert.equal(convertFormulaA1ToR1C1('=TODAY()+1', anchor), '=TODAY()+1')
  assert.equal(convertFormulaR1C1ToA1('=TODAY()+1', anchor), '=TODAY()+1')
})

test('convertFormulaA1ToR1C1 carries an unquoted sheet prefix over unchanged', () => {
  assert.equal(convertFormulaA1ToR1C1('=Sheet1!A1', anchor), '=Sheet1!R[-2]C[-2]')
})

test('convertFormulaA1ToR1C1 carries a quoted sheet prefix over unchanged', () => {
  assert.equal(convertFormulaA1ToR1C1("='My Sheet'!$B$1", anchor), "='My Sheet'!R1C2")
})

test('convertFormulaR1C1ToA1 carries a sheet prefix over unchanged', () => {
  assert.equal(convertFormulaR1C1ToA1('=Sheet1!RC', anchor), '=Sheet1!C3')
})

test('sheet prefix applies to a whole range, not each corner', () => {
  assert.equal(convertFormulaA1ToR1C1('=SUM(Sheet1!A1:B10)', anchor), '=SUM(Sheet1!R[-2]C[-2]:R[7]C[-1])')
  assert.equal(convertFormulaR1C1ToA1('=SUM(Sheet1!R[-2]C[-2]:R[7]C[-1])', anchor), '=SUM(Sheet1!A1:B10)')
})

test('a sheet name with a doubled quote escapes correctly', () => {
  assert.equal(convertFormulaA1ToR1C1("='O''Brien''s Sheet'!A1", anchor), "='O''Brien''s Sheet'!R[-2]C[-2]")
})
