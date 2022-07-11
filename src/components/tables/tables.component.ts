import { Component, OnInit } from '@angular/core';
import { getBorderCharacters, table } from 'table';

const DEFAULT_SEPARATOR = '\t';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit {
  inputText: string = '';
  outputText: string = '';
  separator: string = null!;
  border = 'honeywell';
  copied = false;
  borders = ['honeywell', 'norc', 'ramac', 'void'];

  constructor() {}

  ngOnInit() {}

  public async onUserPropertyChanged(event: any = null) {
    console.log({ event });

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
    if (this.inputText === '') {
      this.outputText = '';
      return;
    }

    const config = { border: getBorderCharacters(this.border) };

    const data = this.inputText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line: any) => line.split(this.separator || DEFAULT_SEPARATOR))
      .map((e) => e ?? '');

    this.outputText = table(data, config).trim();

    console.table(this.outputText);

    console.log({
      inputText: this.inputText,
      outputText: this.outputText,
      separator: this.separator,
    });
  }

  copyToClipboard() {
    // copy content of this.outputText to clipboard
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
