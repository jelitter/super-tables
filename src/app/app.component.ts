import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'tables';
  isDarkMode = false;
  darkMode: boolean = false;

  ngOnInit(): void {
    this.isDarkMode =
      localStorage.getItem('isDarkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  switchTheme(e: any) {
    if (e.target.checked) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      this.darkMode = true;
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      this.darkMode = false;
    }

    console.log({ darkMode: this.darkMode });
  }
}
