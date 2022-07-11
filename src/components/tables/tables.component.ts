import { Component, OnInit } from '@angular/core';
import { fadeInOut } from 'src/animations';
import { getBorderCharacters, table } from 'table';

const DEFAULT_SEPARATOR = '\t';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
  animations: [fadeInOut(300)],
})
export class TablesComponent implements OnInit {
  border = 'norc';
  borders = ['honeywell', 'norc', 'ramac', 'void'];
  copied = false;
  inputText: string = '';
  outputText: string = '';
  separator: string = null!;
  showHeaders = true;
  showAllHorizontalLines = false;

  private empties = new Array(100).fill('');

  constructor() {}

  ngOnInit() {}

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

      const config = {
        border: getBorderCharacters(this.border),
        drawHorizontalLine: (lineIndex: number, rowCount: number) => {
          return (
            this.showAllHorizontalLines ||
            lineIndex === 0 ||
            (this.showHeaders && lineIndex === 1) ||
            lineIndex === rowCount
          );
        },
      };

      const rows = this.inputText
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

      const lineLength = Math.max(
        ...rows.map(
          (line: string) =>
            line.split(this.separator || DEFAULT_SEPARATOR).length
        )
      );

      const data = rows
        .map((line: any) =>
          [
            ...line.split(this.separator || DEFAULT_SEPARATOR),
            ...this.empties,
          ].slice(0, lineLength)
        )
        .map((e) => e ?? '');

      // rows.map((line: any) => line.split(this.separator || DEFAULT_SEPARATOR))
      // .map((e) => e ?? '');

      this.outputText = table(data, config).trim();
    } catch (error) {
      console.warn(error);
    }
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
    }, 1000);
  }
}
