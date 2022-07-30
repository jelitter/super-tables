import { Component, OnInit } from '@angular/core';
import { clean, isValidUrl, toTitleCase } from '@util/string';
import { fadeInOut } from 'src/animations';
import { JsonFetchService } from 'src/services/json-fetch.service';
import { Alignment, getBorderCharacters, table } from 'table';
import { initialSettings } from './tables.config';

type ColWidth = { px: number; chars: number };

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
  animations: [fadeInOut(300)]
})
export class TablesComponent implements OnInit {
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
  public copied = false;
  public customSeparator: string = null!;
  public distance: number = 0;
  public inputText: string | null = initialSettings.input;
  public outputText: string = initialSettings.output;
  public previousOutputText: string = '';
  public separator: string = this.Separators.AUTO_DETECT;
  public showAllHorizontalLines = false;
  public showEmptyAsDash = true;
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

    const entry = Object.entries(this.Separators).find(
      entry => entry[1] === sep
    );

    const result = entry?.[0] ?? '';

    return toTitleCase(result);
  }

  constructor(private readonly jsonFetch: JsonFetchService) {}

  public ngOnInit(): void {
    this.context = this.canvas.getContext('2d');
    this.context!.font = initialSettings.font;
    this.rowHeight = this.getRowHeight('table');

    const inputPre = (document.querySelector('pre.right-top') as HTMLElement)!;

    inputPre.innerText = clean(this.inputText ?? '');
    this.drawTable();

    //  Alt + Shift + F (autoformat)
    document.addEventListener('keydown', event => {
      if (event.altKey && event.shiftKey && event.key === 'F') {
        const rows = clean(this.inputText ?? '').split(/\r?\n/);
        const formattedInput = rows.map(line => line.trim()).join('\n');
        this.setInput(formattedInput);
      }
    });
  }

  public async onUserPropertyChanged(event: any = null) {
    event.preventDefault();
    event.stopPropagation();

    const newValue = event.target.innerText;

    this.inputText = clean(newValue);

    this.drawTable();
  }

  public onSettingsChange() {
    setTimeout(() => {
      this.drawTable();
    }, 16);
  }

  public setSeparator(sep: string) {
    this.separator = sep;
    this.drawTable();
  }

  public isSelected(sep: string) {
    return sep === this.separator;
  }

  private drawTable() {
    this.debounceFunction(async () => {
      try {
        if (this.inputText === '') {
          this.outputText = '';
          this.columnWidths = [];
          this.subTables = [];
          return;
        }

        const texts: string[] = this.allowMultipleTables
          ? (this.inputText ?? '')?.split(/\n{2,}/)
          : [this.inputText ?? ''];

        this.previousOutputText = this.outputText;
        const outputs: string[] = [];
        this.subTables.length = texts.length;
        this.columnWidths.length = texts.length;

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
            this.customSeparator ||
            this.separator === this.Separators.AUTO_DETECT
              ? this.getSeparator()
              : this.separator;

          const lineLength = Math.max(
            ...rows.map((line: string) => line.split(separator).length)
          );

          const empty = this.showEmptyAsDash ? '—' : '';

          const data = rows
            .map((line: string) =>
              [...line.split(separator), ...this.empties].slice(0, lineLength)
            )
            .map(row => row.map(word => word.trim() || empty));

          const pxWidths = data.reduce(
            (acc, row) =>
              row.map((cell, i) =>
                Math.max(
                  acc[i] ?? 0,
                  this.getTextWidth(cell.padEnd(5, 'x') + 'xxx')
                )
              ),
            [] as number[]
          );

          const charWidths = data.reduce(
            (acc, row) =>
              row.map((cell, i) =>
                Math.max(acc[i] ?? 0, Math.max(5, cell.trim().length))
              ),
            [] as number[]
          );

          this.columnWidths[subTableIndex] = pxWidths.map((px, i) => {
            config.columns[i] = {
              alignment: this.getColumnAlignment(subTableIndex, i),
              width: charWidths[i]
            };

            return {
              px,
              chars: charWidths[i]
            };
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

          const subTable = table(data, config);
          this.subTables[subTableIndex] = subTable.split(/\r?\n/);
          outputs.push(subTable);
        });

        const newOutputText = outputs.join('\n');

        this.distance = Math.abs(
          this.previousOutputText.length - newOutputText.length
        );

        if (this.distance > 100) {
          this.uuid = crypto.getRandomValues(new Uint8Array(8)).toString();
        }

        this.outputText = newOutputText;
      } catch (error) {
        // console.warn(error);
      }
    });
  }

  public getSeparator(): string {
    const rows = (this.inputText ?? '')
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0);

    const separators = Object.values(this.Separators);

    const separatorCounts = separators.map(sep => {
      return rows.reduce((acc, line) => {
        return acc + line.split(sep).length;
      }, 0);
    });

    const maxCount = Math.max(...separatorCounts);

    const auto =
      separators.find(
        sep => separatorCounts[separators.indexOf(sep)] === maxCount
      ) ?? 'auto';

    return auto;
  }

  public setInput(text: string) {
    this.inputText = text;
    const inputPre = (document.querySelector('pre.right-top') as HTMLElement)!;
    inputPre.innerText = this.inputText ?? '';
    this.drawTable();
  }

  public clearInput() {
    this.setInput('');
  }

  public alignColumn(
    subTableIndex: number,
    columnIndex: number,
    alignment: Alignment
  ) {
    this.alignments[subTableIndex].get('left')?.delete(columnIndex);
    this.alignments[subTableIndex].get('center')?.delete(columnIndex);
    this.alignments[subTableIndex].get('right')?.delete(columnIndex);
    this.alignments[subTableIndex].get(alignment)?.add(columnIndex);
    this.drawTable();
  }

  public getColumnAlignment(
    subTableIndex: number,
    columnIndex: number
  ): Alignment {
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

  private debounceFunction(
    func: CallableFunction,
    wait = 100,
    immediate = false
  ) {
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
      const height = Math.floor(
        this.context.measureText(text).fontBoundingBoxAscent
      );
      return height;
    }
    return 0;
  }

  public getSubTableMarginTop(subTableIndex: number): number {
    if (subTableIndex === 0) {
      return 0;
    }

    return (
      this.subTables[subTableIndex - 1].length * this.rowHeight +
      this.getSubTableMarginTop(subTableIndex - 1)
    );
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
      this.setInput(this.getInputTextFromArray(obj));
    }

    this.urlInput = '';
    this.columnWidths = [];
  };

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
