import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { clean, DASH, getUuid, isJsonArray, isValidJson, isValidUrl, toTitleCase } from '@util/string';
import { fadeInOut } from 'src/animations';
import { JsonFetchService } from 'src/services/json-fetch.service';
import { Alignment, getBorderCharacters, table } from 'table';
import { ColumnConfig, defaultColumnConfig, initialSettings } from './tables.config';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
  animations: [fadeInOut(300)]
})
export class TablesComponent implements OnInit, AfterViewInit {
  @ViewChild('input', { read: ElementRef }) inputPre!: ElementRef<HTMLElement>;

  private canvas = document.createElement('canvas');
  private context: CanvasRenderingContext2D | null = null;
  private empties: string[] = new Array(100).fill('');
  private rowHeight: number = 0;
  private timeout?: NodeJS.Timeout;
  private textWidths: Map<number, number> = new Map();
  private subTableWidths: Map<number, number> = new Map();

  public Separators = {
    AUTO_DETECT: 'auto',
    TAB: '\t',
    FOUR_SPACES: '    ',
    COMMA: ',',
    PIPE: '|'
  };

  public alignments: Map<Alignment, Set<number>>[] = [
    new Map([
      ['left', new Set()],
      ['center', new Set()],
      ['right', new Set()]
    ])
  ];
  public allowMultipleTables = true;
  public border = 'norc';
  public borders = ['honeywell', 'norc', 'ramac', 'void'];
  public columnConfigs: ColumnConfig[][] = [];
  public copied = false;
  public copiedSubTable: number | null = null;
  public customSeparator: string = null!;
  public distance: number = 0;
  public hoveredSubTable: number | null = null;
  public inputText: string | null = initialSettings.input;
  public isVertical = true;
  public outputText: string = initialSettings.output;
  public previousOutputText: string = '';
  public selectedColumns: string[][] = [];
  public separator: string = this.Separators.AUTO_DETECT;
  public showAllHorizontalLines = false;
  public showDebug = false;
  public showEmptyAsDash = true;
  public showHeaderControls = false;
  public showHeaders = true;
  public subTables: string[][] = [];
  public urlInput = initialSettings.url;
  public uuid: string = '';

  get isUrlInputValid(): boolean {
    return isValidUrl((this.urlInput ?? '').trim());
  }

  get activeSeparator() {
    const sep: string = this.customSeparator
      ? this.customSeparator
      : this.separator === this.Separators.AUTO_DETECT
      ? this.getSeparator()
      : this.separator;

    if (sep === this.Separators.AUTO_DETECT) {
      return 'None';
    }

    const entry = Object.entries(this.Separators).find(entry => entry[1] === sep);

    const result = this.customSeparator ? 'CUSTOM' : entry?.[0] ?? '';

    return toTitleCase(result);
  }

  constructor(private readonly jsonFetch: JsonFetchService) {}

  public ngOnInit(): void {
    this.context = this.canvas.getContext('2d');
    this.context!.font = initialSettings.font;
    this.rowHeight = 17;

    document.addEventListener('keydown', event => {
      //  Alt + Shift + F (autoformat)
      if (event.altKey && event.shiftKey && event.key === 'F') {
        let formattedInput = '';
        if (isValidJson(this.inputText)) {
          formattedInput = JSON.stringify(JSON.parse(this.inputText ?? ''), null, 2);
        } else {
          const rows = clean(this.inputText ?? '').split(/\r?\n/);
          formattedInput = rows.map(line => line.trim()).join('\n');
        }

        this.setInput(formattedInput);
      }
      //  Alt + Shift + D (show debug info)
      if (event.altKey && event.shiftKey && event.key === 'D') {
        this.showDebug = !this.showDebug;
      }
    });
  }

  public ngAfterViewInit(): void {
    this.inputPre.nativeElement.innerText = clean(this.inputText ?? '');
    this.drawTable();
  }

  public async onInputChanged(event: any = null) {
    event.preventDefault();
    event.stopPropagation();

    const newValue = event.target.innerText;

    this.distance = Math.abs(newValue.length - (this.inputText ?? '').length);

    if (this.distance > 100) {
      this.uuid = getUuid();
      this.reset();
    }

    this.inputText = clean(newValue);

    this.drawTable();
  }

  public onSettingsChange() {
    setTimeout(() => {
      this.drawTable();
    }, 16);
  }

  public onSelectedHeadersChanged() {
    setTimeout(() => {
      this.drawTable();
    });
  }

  public onMouseEnter(index: number) {
    this.debounceFunction(() => {
      this.hoveredSubTable = index;
    }, 100);
  }

  public onMouseLeave() {
    this.debounceFunction(() => {
      this.hoveredSubTable = null;
    }, 100);
  }

  public setSeparator(sep: string) {
    this.separator = sep;
    this.drawTable();
  }

  public isSelected(subTableIndex: number, config: ColumnConfig) {
    return this.selectedColumns[subTableIndex].includes(config.id);
  }

  private reset() {
    this.alignments = [];
    this.outputText = '';
    this.columnConfigs = [];
    this.selectedColumns = [];
    this.subTables = [];
    this.subTableWidths.clear();
  }

  private drawTable() {
    const inputText = this.getInputText();

    this.debounceFunction(async () => {
      try {
        if (inputText === '') {
          this.reset();
          return;
        }

        const texts: string[] = this.allowMultipleTables ? (inputText ?? '')?.split(/\n{2,}/) : [inputText ?? ''];

        this.previousOutputText = this.outputText;
        const outputs: string[] = [];
        this.subTables.length = texts.length;
        this.columnConfigs.length = texts.length;
        this.selectedColumns.length = texts.length;

        const separator =
          this.customSeparator || this.separator === this.Separators.AUTO_DETECT ? this.getSeparator() : this.separator;

        texts.forEach((text, subTableIndex) => {
          const rows = (text ?? '').split(/\r?\n/);

          const dividersBefore = rows
            .map((r, i) => (r.trim() === '---' ? i : null))
            .filter(n => n !== null) as number[];

          for (let i = dividersBefore.length - 1; i >= 0; i--) {
            rows.splice(dividersBefore[i], 1);
          }

          const dividers = dividersBefore.map((d, i) => d - i);

          const config = {
            border: getBorderCharacters(this.border),
            drawHorizontalLine: (lineIndex: number, rowCount: number) => {
              return (
                this.showAllHorizontalLines ||
                lineIndex === 0 ||
                (this.showHeaders && lineIndex === 1) ||
                lineIndex === rowCount ||
                dividers.includes(lineIndex)
              );
            },
            columns: (this.columnConfigs[subTableIndex] ??= []).map(() => ({
              alignment: 'left' as Alignment,
              width: 1
            }))
          };

          const lineLength = Math.max(...rows.map((line: string) => line.split(separator).length));

          const empty = this.showEmptyAsDash ? DASH : '';

          const data = rows
            .map((line: string) => [...line.split(separator), ...this.empties].slice(0, lineLength))
            .map(row => row.map(word => word.trim() || empty));

          // const minCharWidth = this.showHeaderControls ? 6 : 3;
          const minCharWidth = 6;

          const pxWidths = data.reduce(
            (acc, row) =>
              row.map((cell, i) => Math.max(acc[i] ?? 0, this.getTextWidth(cell.padEnd(minCharWidth, 'x') + 'xxx'))),
            [] as number[]
          );

          const charWidths = data.reduce(
            (acc, row) => row.map((cell, i) => Math.max(acc[i] ?? 0, Math.max(minCharWidth, cell.trim().length))),
            [] as number[]
          );

          this.selectedColumns[subTableIndex] ??= [];
          this.columnConfigs[subTableIndex] ??= [];

          this.columnConfigs[subTableIndex] = data[0].map((header, i) => {
            const existingId = this.columnConfigs?.[subTableIndex]?.[i]?.id;

            const config = {
              ...(this.columnConfigs[subTableIndex][i] ??= defaultColumnConfig()),
              index: i,
              header: header.trim(),
              width: { px: pxWidths[i], chars: charWidths[i] }
            };

            if (!existingId) {
              this.selectedColumns[subTableIndex].push(config.id);
            }

            return config;
          });

          this.columnConfigs[subTableIndex].forEach((column, i) => {
            config.columns[i] = {
              alignment: this.getColumnAlignment(subTableIndex, i),
              width: charWidths[i]
            };
          });

          if (!this.alignments[subTableIndex]) {
            this.alignments[subTableIndex] = new Map([
              ['left', new Set()],
              ['center', new Set()],
              ['right', new Set()]
            ]);
          }

          this.columnConfigs.forEach((_, i) => {
            if (
              !this.alignments[subTableIndex].get('left')?.has(i) &&
              !this.alignments[subTableIndex].get('center')?.has(i) &&
              !this.alignments[subTableIndex].get('right')?.has(i)
            ) {
              this.alignments[subTableIndex].get('left')?.add(i);
            }
          });

          const renderColumnIndices = this.columnConfigs[subTableIndex]
            .filter(c => this.isSelected(subTableIndex, c))
            .map(c => c.index);

          const filteredData = data.map(row => row.filter((_, i) => renderColumnIndices.includes(i)));
          const filteredConfig = {
            ...config,
            columns: config.columns.filter((_, i) => renderColumnIndices.includes(i))
          };

          const subTable = filteredData?.[0]?.length > 0 ? table(filteredData, filteredConfig) : '';
          this.subTables[subTableIndex] = subTable.split(/\r?\n/);

          this.columnConfigs[subTableIndex].forEach(
            c => (c.height = this.rowHeight * (this.subTables[subTableIndex].length - 1))
          );

          outputs.push(subTable);
        });

        const newOutputText = outputs.join('\n');

        this.outputText = newOutputText;
      } catch (error) {
        // console.warn(error);
      }
    });
  }

  public getSeparator(): string {
    const rows = (this.getInputText() ?? '').split(/\r?\n/).filter(line => line.trim().length > 0);

    const separators = Object.values(this.Separators);

    const separatorCounts = separators.map(sep => {
      return rows.reduce((acc, line) => {
        return acc + line.split(sep).length;
      }, 0);
    });

    const maxCount = Math.max(...separatorCounts);

    const auto = separators.find(sep => separatorCounts[separators.indexOf(sep)] === maxCount) ?? 'auto';

    return auto;
  }

  public setInput(text: string) {
    this.inputText = text;
    this.inputPre.nativeElement.innerText = this.inputText ?? '';
    this.drawTable();
  }

  public clearInput() {
    this.reset();
    this.setInput('');
  }

  public alignColumn(subTableIndex: number, columnIndex: number, alignment: Alignment) {
    this.alignments[subTableIndex].get('left')?.delete(columnIndex);
    this.alignments[subTableIndex].get('center')?.delete(columnIndex);
    this.alignments[subTableIndex].get('right')?.delete(columnIndex);
    this.alignments[subTableIndex].get(alignment)?.add(columnIndex);
    this.drawTable();
  }

  public getColumnAlignment(subTableIndex: number, columnIndex: number): Alignment {
    if (this.alignments?.[subTableIndex]?.get('left')?.has(columnIndex)) {
      return 'left' as Alignment;
    }
    if (this.alignments?.[subTableIndex]?.get('center')?.has(columnIndex)) {
      return 'center' as Alignment;
    }
    if (this.alignments?.[subTableIndex]?.get('right')?.has(columnIndex)) {
      return 'right' as Alignment;
    }
    return 'left' as Alignment;
  }

  public async copyToClipboard() {
    await navigator.clipboard.writeText(this.outputText);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1000);
  }

  public async copySubTable(subTableIndex: number) {
    await navigator.clipboard.writeText(this.subTables[subTableIndex].join('\n'));
    this.copiedSubTable = subTableIndex;
    setTimeout(() => {
      this.copiedSubTable = null;
    }, 1000);
  }

  private debounceFunction(func: CallableFunction, wait = 100, immediate = false) {
    const later = () => {
      this.timeout = undefined;
      if (!immediate) {
        func();
      }
    };

    const callNow = immediate && !this.timeout;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(later, wait);
    if (callNow) {
      func();
    }
  }

  public getTextWidth(text: string): number {
    if (this.textWidths.has(text.length)) {
      return this.textWidths.get(text.length) ?? 0;
    }

    if (this.context) {
      const width = Math.floor(this.context.measureText(text).width);

      this.textWidths.set(text.length, width);

      return width;
    }
    return 0;
  }

  private getRowHeight(text: string) {
    if (this.context) {
      const height = Math.floor(this.context.measureText(text).fontBoundingBoxAscent);
      return height;
    }
    return 0;
  }

  public getSubTableMarginTop(subTableIndex: number): number {
    if (subTableIndex === 0) {
      return 2;
    }

    return this.subTables[subTableIndex - 1].length * this.rowHeight + this.getSubTableMarginTop(subTableIndex - 1);
  }

  public getSubTableWidth(subTableIndex: number): number {
    return this.columnConfigs[subTableIndex]
      .filter(t => this.selectedColumns[subTableIndex].includes(t.id))
      .reduce((acc, c) => acc + c.width.px, 20);

    // if (!this.subTableWidths.has(subTableIndex)) {
    //   const width = this.columnConfigs[subTableIndex]
    //     .filter(t => this.selectedColumns[subTableIndex].includes(t.id))
    //     .reduce((acc, c) => acc + c.width.px, 0);
    //   this.subTableWidths.set(subTableIndex, width + 20);
    // }

    // return this.subTableWidths.get(subTableIndex) ?? 0;
  }

  public fetchUrl = async () => {
    if (!this.isUrlInputValid) {
      return;
    }

    const url = (this.urlInput ?? '').trim();

    const obj = await this.jsonFetch.get(url);
    if (!obj) {
      this.outputText = `Could not fetch ${url}`;
    } else if (!Array.isArray(obj)) {
      this.outputText = `Content is not an array.`;
    } else {
      this.setInput(JSON.stringify(obj, null, 2));
    }

    this.urlInput = '';
    this.columnConfigs = [];
    // this.columnHeaders = [];
    // this.selectedHeaders = [];
    this.alignments = [];
  };

  private getInputText(): string {
    if (isJsonArray(this.inputText)) {
      const arr = JSON.parse(this.inputText ?? '');
      return this.getInputTextFromArray(arr);
    }

    return this.inputText ?? '';
  }

  public trackByIndex = (index: number) => index;

  private getInputTextFromArray = (arr: any[]): string => {
    const headers: string[] = [];
    const values: string[][] = [];

    arr.forEach(obj => {
      Object.keys(obj).forEach(key => {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      });
    });

    arr.forEach(obj => {
      const valuesRow: string[] = [];
      headers.forEach(key => {
        valuesRow.push(obj[key] ?? '');
      });
      values.push(valuesRow);
    });

    let tsv = `${headers.map(key => `${key}`).join('\t')}\n`;

    values.forEach(row => {
      tsv += `${row.map(value => `${value}`).join('\t')}\n`;
    });

    return clean(tsv);
  };
}
