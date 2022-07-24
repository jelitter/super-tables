import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'tables';
  isDarkMode = false;

  public ngOnInit(): void {
    const theme: 'dark' | 'light' =
      (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
    this.setTheme(theme);
  }

  public switchTheme(e: any) {
    const theme = e.target.checked ? 'dark' : 'light';
    this.setTheme(theme);
  }

  public setTheme(theme: 'dark' | 'light') {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.isDarkMode = theme === 'dark';
  }
}
