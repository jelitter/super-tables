import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { clean, DASH, isJsonArray, isValidJson, isValidUrl, toTitleCase } from '@util/string';
import { fadeInOut } from 'src/animations';
import { JsonFetchService } from 'src/services/json-fetch.service';
import { Alignment, getBorderCharacters, table } from 'table';
import { initialSettings } from './tables.config';

type ColWidth = { px: number; chars: number; hidden: boolean };

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
  public columnWidths: ColWidth[][] = [];
  public columnHeaders: string[][] = [];
  public selectedHeaders: string[][] = [];
  public copied = false;
  public customSeparator: string = null!;
  public distance: number = 0;
  public inputText: string | null = initialSettings.input;
  public outputText: string = initialSettings.output;
  public previousOutputText: string = '';
  public separator: string = this.Separators.AUTO_DETECT;
  public showAllHorizontalLines = false;
  public showEmptyAsDash = true;
  public showHeaderControls = true;
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

    const result = entry?.[0] ?? '';

    return toTitleCase(result);
  }

  constructor(private readonly jsonFetch: JsonFetchService) {}

  public ngOnInit(): void {
    this.context = this.canvas.getContext('2d');
    this.context!.font = initialSettings.font;
    // this.rowHeight = this.getRowHeight('table');
    this.rowHeight = 17;

    //  Alt + Shift + F (autoformat)
    document.addEventListener('keydown', event => {
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
      this.uuid = crypto.getRandomValues(new Uint8Array(8)).toString();
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

  public setSeparator(sep: string) {
    this.separator = sep;
    this.drawTable();
  }

  public isSelected(sep: string) {
    return sep === this.separator;
  }

  private reset() {
    this.alignments = [];
    this.outputText = '';
    this.columnWidths = [];
    this.columnHeaders = [];
    this.selectedHeaders = [];
    this.subTables = [];
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
        this.columnWidths.length = texts.length;
        this.columnHeaders.length = texts.length;
        this.selectedHeaders.length = texts.length;

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
            columns: (this.columnWidths[subTableIndex] ??= []).map(() => ({
              alignment: 'left' as Alignment,
              width: 1
            }))
          };

          const separator =
            this.customSeparator || this.separator === this.Separators.AUTO_DETECT
              ? this.getSeparator()
              : this.separator;

          const lineLength = Math.max(...rows.map((line: string) => line.split(separator).length));

          const empty = this.showEmptyAsDash ? DASH : '';

          const data = rows
            .map((line: string) => [...line.split(separator), ...this.empties].slice(0, lineLength))
            .map(row => row.map(word => word.trim() || empty));

          this.columnHeaders[subTableIndex] = data[0];

          if (!this.selectedHeaders[subTableIndex]) {
            this.selectedHeaders[subTableIndex] = data[0];
          }

          if (
            this.selectedHeaders[subTableIndex]?.length !== data[0]?.length ||
            this.selectedHeaders[subTableIndex].at(-1) === DASH
          ) {
            this.selectedHeaders[subTableIndex] = data[0];
          }

          const minCharWidth = this.showHeaderControls ? 6 : 3;

          const pxWidths = data.reduce(
            (acc, row) =>
              row.map((cell, i) => Math.max(acc[i] ?? 0, this.getTextWidth(cell.padEnd(minCharWidth, 'x') + 'xxx'))),
            [] as number[]
          );

          const charWidths = data.reduce(
            (acc, row) => row.map((cell, i) => Math.max(acc[i] ?? 0, Math.max(minCharWidth, cell.trim().length))),
            [] as number[]
          );

          this.columnWidths[subTableIndex] = pxWidths.map((px, i) => {
            config.columns[i] = {
              alignment: this.getColumnAlignment(subTableIndex, i),
              width: charWidths[i]
            };

            return { px, chars: charWidths[i], hidden: false };
          });

          if (!this.alignments[subTableIndex]) {
            this.alignments[subTableIndex] = new Map([
              ['left', new Set()],
              ['center', new Set()],
              ['right', new Set()]
            ]);
          }

          this.columnWidths.forEach((_, i) => {
            if (
              !this.alignments[subTableIndex].get('left')?.has(i) &&
              !this.alignments[subTableIndex].get('center')?.has(i) &&
              !this.alignments[subTableIndex].get('right')?.has(i)
            ) {
              this.alignments[subTableIndex].get('left')?.add(i);
            }
          });

          const selectedHeaders = this.selectedHeaders[subTableIndex];
          const renderColumnIndices = data[0]
            .map((_, i) => (selectedHeaders.includes(data[0][i]) ? i : null))
            .filter(n => n !== null);

          const filteredData = data.map(row => row.filter((_, i) => renderColumnIndices.includes(i)));
          const filteredConfig = {
            ...config,
            columns: config.columns.filter((_, i) => renderColumnIndices.includes(i))
          };

          this.columnWidths[subTableIndex].forEach((columnWidth, j) => {
            columnWidth.hidden = !renderColumnIndices.includes(j);
          });

          const subTable = filteredData?.[0]?.length > 0 ? table(filteredData, filteredConfig) : '';
          this.subTables[subTableIndex] = subTable.split(/\r?\n/);

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

  public copyToClipboard() {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.outputText;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 1500);
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

  public getTextWidth(text: string) {
    if (this.context) {
      const width = Math.floor(this.context.measureText(text).width);
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
      return -2;
    }

    return this.subTables[subTableIndex - 1].length * this.rowHeight + this.getSubTableMarginTop(subTableIndex - 1);
  }

  public fetch = async () => {
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
    this.columnWidths = [];
    this.columnHeaders = [];
    this.selectedHeaders = [];
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
