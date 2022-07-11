import { Component, OnInit } from '@angular/core';
import { getBorderCharacters, table } from 'table';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit {
  inputText: string = '';
  outputText: string = '';
  border = 'honeywell';
  copied = false;
  borders = ['honeywell', 'norc', 'ramac', 'void'];

  constructor() {}

  ngOnInit() {}

  public async onUserPropertyChanged(event: any = null) {
    console.log({ event });
    const isBlurEvent = event.type === 'blur';

    event.preventDefault();
    event.stopPropagation();

    const prevValue = this.inputText;
    const newValue = event.target.innerText;

    this.inputText = newValue;

    this.drawTable();
  }

  onBorderChange() {
    this.drawTable();
  }

  private drawTable() {
    const data = this.inputText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line: any) => line.split('\t'));

    const config = { border: getBorderCharacters(this.border) };

    this.outputText = table(data, config).trim();

    console.log({ inputText: this.inputText, outputText: this.outputText });
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
