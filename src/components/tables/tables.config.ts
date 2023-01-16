import { getUuid } from '@util/string';

const initialInput = `Name    Location    Powers
Luke Skywalker    Tatooine    The Force
Han Solo    Dagobah
R2-D2    Naboo
Leia Organa    Alderaan

Planet     Terrain     Climate
Tatooine     Desert     Arid
Naboo    Grassy hills, swamps, etc    Temperate
Alderaan    Grasslands, mountains    Temperate
---
Death Star    Artificial    Climatized`;

const initialOutput = `┌────────────────┬──────────┬───────────┐
│ Name           │ Location │ Powers    │
├────────────────┼──────────┼───────────┤
│ Luke Skywalker │ Tatooine │ The Force │
│ R2-D2          │ Naboo    │ —         │
│ Leia Organa    │ Alderaan │ —         │
└────────────────┴──────────┴───────────┘

┌────────────┬───────────────────────────┬────────────┐
│ Planet     │ Terrain                   │ Climate    │
├────────────┼───────────────────────────┼────────────┤
│ Tatooine   │ Desert                    │ Arid       │
│ Naboo      │ Grassy hills, swamps, etc │ Temperate  │
│ Alderaan   │ Grasslands, mountains     │ Temperate  │
├────────────┼───────────────────────────┼────────────┤
│ Death Star │ Artificial                │ Climatized │
└────────────┴───────────────────────────┴────────────┘`;

const initialUrl = 'https://jsonplaceholder.typicode.com/albums';

const fontString =
  '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const initialSettings = {
  input: initialInput,
  output: initialOutput,
  url: initialUrl,
  font: fontString
};

export type ColumnConfig = {
  id: string;
  index: number;
  header: string;
  height: number;
  width: { px: number; chars: number };
};

export const defaultColumnConfig = (): ColumnConfig => ({
  id: getUuid(),
  index: 0,
  header: '',
  height: 15,
  width: { px: 75, chars: 5 }
});
