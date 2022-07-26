const initialInput = `Col1    Col2    Col3    Numeric Column
Val1    Val2    Val3    123.45

Val4    Val5    Val6    678.95
Val7        Val8
    Val9        9000.1
---
Sub header
---
Item 1
Item 2

Item 3`;

const initialOutput = `┌────────────┬───────┬───────┬────────────────┐
│ Col1       │ Col2  │ Col3  │ Numeric Column │
├────────────┼───────┼───────┼────────────────┤
│ Val1       │ Val2  │ Val3  │ 123.45         │
│ —          │ —     │ —     │ —              │
│ Val4       │ Val5  │ Val6  │ 678.95         │
│ Val7       │ —     │ Val8  │ —              │
│ —          │ Val9  │ —     │ 9000.1         │
├────────────┼───────┼───────┼────────────────┤
│ Sub header │ —     │ —     │ —              │
├────────────┼───────┼───────┼────────────────┤
│ Item 1     │ —     │ —     │ —              │
│ Item 2     │ —     │ —     │ —              │
│ —          │ —     │ —     │ —              │
│ Item 3     │ —     │ —     │ —              │
└────────────┴───────┴───────┴────────────────┘`;

const initialUrl = 'https://jsonplaceholder.typicode.com/albums';

const fontString =
  '16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const initialSettings = {
  input: initialInput,
  output: initialOutput,
  url: initialUrl,
  font: fontString
};
