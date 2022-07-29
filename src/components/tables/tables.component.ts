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
  private timeout?: NodeJS.Timeout;
  private empties: string[] = new Array(100).fill('');
  private canvas = document.createElement('canvas');
  private context = this.canvas.getContext('2d');

  public Separators = {
    AUTO_DETECT: 'auto',
    TAB: '\t',
    FOUR_SPACES: '    ',
    COMMA: ',',
    PIPE: '|'
  };

  public alignments: Map<Alignment, Set<number>> = new Map([
    ['left', new Set()],
    ['center', new Set()],
    ['right', new Set()]
  ]);
  public border = 'norc';
  public borders = ['honeywell', 'norc', 'ramac', 'void'];
  public columnWidths: ColWidth[] = [];
  public copied = false;
  public customSeparator: string = null!;
  public inputText: string | null = initialSettings.input;
  public outputText: string = initialSettings.output;
  public separator: string = this.Separators.AUTO_DETECT;
  public showAllHorizontalLines = false;
  public showEmptyAsDash = true;
  public showHeaders = true;
  public urlInput = initialSettings.url;

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
    const inputPre = (document.querySelector('pre.right-top') as HTMLElement)!;

    inputPre.innerText = clean(this.inputText ?? '');
    this.drawTable();

    //  Alt + Shift + F (autoformat)
    document.addEventListener('keydown', event => {
      if (event.altKey && event.shiftKey && event.key === 'F') {
        const rows = clean(this.inputText ?? '')
          .split(/\r?\n/)
          .filter(line => line.trim().length > 0);
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
          return;
        }

        const rows = (this.inputText ?? '').split(/\r?\n/);

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
          columns: this.columnWidths.map(() => ({
            alignment: 'left' as Alignment,
            width: 1
          }))
        };

        const separator =
          this.customSeparator || this.separator === this.Separators.AUTO_DETECT
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
                this.getTextWidth(
                  cell.padEnd(5, 'x') + 'xxx',
                  initialSettings.font
                )
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

        this.columnWidths = pxWidths.map((px, i) => {
          config.columns[i] = {
            alignment: this.getColumnAlignment(i),
            width: charWidths[i]
          };

          return {
            px,
            chars: charWidths[i]
          };
        });

        this.columnWidths.forEach((_, i) => {
          if (
            !this.alignments.get('left')?.has(i) &&
            !this.alignments.get('center')?.has(i) &&
            !this.alignments.get('right')?.has(i)
          ) {
            this.alignments.get('left')?.add(i);
          }
        });

        this.outputText = table(data, config).trim();
      } catch (error) {
        console.warn(error);
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

  public alignColumn(index: number, alignment: Alignment) {
    this.alignments.get('left')?.delete(index);
    this.alignments.get('center')?.delete(index);
    this.alignments.get('right')?.delete(index);
    this.alignments.get(alignment)?.add(index);
    this.drawTable();
  }

  public getColumnAlignment(index: number): Alignment {
    if (this.alignments.get('left')?.has(index)) {
      return 'left' as Alignment;
    }
    if (this.alignments.get('center')?.has(index)) {
      return 'center' as Alignment;
    }
    if (this.alignments.get('right')?.has(index)) {
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

  public getTextWidth(text: string, font: string) {
    if (this.context) {
      this.context.font = font;
      const width = Math.floor(this.context.measureText(text).width);
      return width;
    }
    return 0;
  }

  public fetch = async () => {
    console.log({ url: this.urlInput });

    if (!this.isUrlInputValid) {
      return;
    }

    const url = (this.urlInput ?? '').trim();
    // this.outputText = `URL detected:\n${url}`;

    const obj = await this.jsonFetch.get(url);
    if (!obj) {
      this.outputText = `Could not fetch ${url}`;
    } else if (!Array.isArray(obj)) {
      this.outputText = `Content is not an array.`;
      console.log({ obj });
    } else {
      this.setInput(this.getInputTextFromArray(obj));
    }

    this.urlInput = '';
    this.columnWidths = [];
  };

  public trackByIndex = (index: number, item: any) => index;

  private getInputTextFromArray = (arr: any[]): string => {
    console.log({ arr });

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

    console.log({ headers, values, tsv });
    return clean(tsv);
  };
}
