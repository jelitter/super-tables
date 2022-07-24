import { Component, OnInit } from '@angular/core';
import { fadeInOut } from 'src/animations';
import { getBorderCharacters, table } from 'table';
import { initialInput } from './tables.config';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
  animations: [fadeInOut(300)],
})
export class TablesComponent implements OnInit {
  Separators = {
    AUTO_DETECT: 'auto',
    TAB: '\t',
    FOUR_SPACES: '    ',
    COMMA: ',',
    PIPE: '|',
  };

  border = 'norc';
  borders = ['honeywell', 'norc', 'ramac', 'void'];
  copied = false;
  inputText: string | null = initialInput;
  outputText: string = '';
  separator: string = this.Separators.AUTO_DETECT;
  customSeparator: string = null!;
  showHeaders = true;
  showAllHorizontalLines = false;
  showEmptyAsDash = false;

  private empties = new Array(100).fill('');

  get activeSeparator() {
    const sep: string = this.customSeparator
      ? this.customSeparator
      : this.separator === this.Separators.AUTO_DETECT
      ? this.getSeparator()
      : this.separator;

    // Get 'Separators' key matching 'sep' value:
    const entry = Object.entries(this.Separators).find(
      (entry) => entry[1] === sep
    );

    const result = entry?.[0] ?? '???';

    return result;
  }

  constructor() {}

  ngOnInit(): void {
    const inputPre = (document.querySelector('pre.right-top') as HTMLElement)!;
    inputPre.innerText = this.inputText ?? '';
    this.drawTable();

    //  Alt + Shift + F (autoformat)
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.shiftKey && event.key === 'F') {
        const rows = (this.inputText ?? '')
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);
        const formattedInput = rows.map((line) => line.trim()).join('\n');
        this.setInput(formattedInput);
      }
    });
  }

  public async onUserPropertyChanged(event: any = null) {
    event.preventDefault();
    event.stopPropagation();

    const newValue = event.target.innerText;

    this.inputText = newValue;

    this.drawTable();
  }

  onSettingsChange() {
    setTimeout(() => {
      this.drawTable();
    }, 16);
  }

  setSeparator(sep: string) {
    this.separator = sep;
    this.drawTable();
  }

  isSelected(sep: string) {
    return sep === this.separator;
  }

  private drawTable() {
    try {
      if (this.inputText === '') {
        this.outputText = '';
        return;
      }

      let rows = (this.inputText ?? '').split(/\r?\n/);
      // .filter((line) => line.trim().length > 0);

      const dividersBefore = rows
        .map((r, i) => (r.trim() === '---' ? i : null))
        .filter((n) => n !== null) as number[];

      // Remove lines with dividers:
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
        .map((line: any) =>
          [...line.split(separator), ...this.empties].slice(0, lineLength)
        )
        .map((r) => r.map((e) => e || empty));

      this.outputText = table(data, config).trim();
    } catch (error) {
      console.warn(error);
    }
  }

  public getSeparator(): string {
    const rows = (this.inputText ?? '')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    const separators = Object.values(this.Separators);

    const separatorCounts = separators.map((sep) => {
      return rows.reduce((acc, line) => {
        return acc + line.split(sep).length;
      }, 0);
    });

    const maxCount = Math.max(...separatorCounts);

    const auto = separators.find(
      (sep) => separatorCounts[separators.indexOf(sep)] === maxCount
    )!;

    return auto;
  }

  setInput(text: string) {
    this.inputText = text;
    const inputPre = (document.querySelector('pre.right-top') as HTMLElement)!;
    inputPre.innerText = this.inputText ?? '';
    this.drawTable();
  }

  clearInput() {
    this.setInput('');
  }

  copyToClipboard() {
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
}
