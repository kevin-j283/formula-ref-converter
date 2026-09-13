# formula-ref-converter

Spreadsheets have two ways of writing a cell reference inside a formula:

- **A1 notation**: `A1`, `$A1`, `A$1`, `$A$1` — column letters and a row
  number, with `$` marking an axis as absolute.
- **R1C1 notation**: `R1C1`, `RC`, `R[1]C[-2]`, `R5C[3]` — row and column
  numbers, where a bracketed value is an offset relative to the formula's own
  cell (the "anchor") and a bare number is absolute.

Excel can display either one, and copying a formula between rows/columns
means recalculating every relative reference against wherever the formula
lands. This library does that conversion directly on the formula text,
without needing a real spreadsheet engine.

## Usage

```ts
import { convertFormulaA1ToR1C1, convertFormulaR1C1ToA1 } from './src/index.js'

// Formula lives in cell C3.
const anchor = { row: 3, col: 3 }

convertFormulaA1ToR1C1('=SUM(A1:A10)+$B$1', anchor)
// => '=SUM(R[-2]C[-2]:R[7]C[-2])+R1C2'

convertFormulaR1C1ToA1('=R[-2]C[-2]+R1C2', anchor)
// => '=A1+B1'
```

Range references (`A1:B2`) are converted as a unit, with each corner
resolved against the same anchor:

```ts
convertFormulaA1ToR1C1('=SUM(A1:B10)', { row: 3, col: 3 })
// => '=SUM(R[-2]C[-2]:R[7]C[-1])'
```

Reference-level helpers are also exported for anyone who wants to work with
a single cell or range instead of a whole formula:

```ts
import { parseA1CellRef, formatR1C1CellRef, parseA1Range } from './src/index.js'

const ref = parseA1CellRef('$B$7')
// => { row: 7, col: 2, rowAbsolute: true, colAbsolute: true }

formatR1C1CellRef(ref!, { row: 3, col: 3 })
// => 'R7C2'

parseA1Range('A1:B2')
// => { start: { row: 1, col: 1, ... }, end: { row: 2, col: 2, ... } }
```

Every exported function is pure: given the same arguments it always returns
the same result, and none of them touch the filesystem, the network, or any
shared state. That makes them straightforward to unit test with plain
input/output pairs.

## Building

```
tsc
```

compiles `src/` to `dist/` per `tsconfig.json`. There are no runtime
dependencies to install.

## Known limitations (first pass)

- Sheet-qualified references (`Sheet1!A1`) are not specially recognized —
  the sheet name is left alone and only the trailing cell reference is
  converted.
- Whole-row/whole-column references (`R1` or `C1` alone, or A1-style `1:1`)
  are not handled yet.
- The word-boundary checks that keep the converter from mangling function
  names are regex-based and can be fooled by unusual identifiers.

## License

MIT, see [LICENSE](LICENSE).
