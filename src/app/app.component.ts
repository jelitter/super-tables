import { Component, OnInit } from '@angular/core';
import { fadeInOut } from 'src/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeInOut(300)]
})
export class AppComponent implements OnInit {
  public title = 'tables';
  public isDarkMode = false;

  public ngOnInit(): void {
    const theme: 'dark' | 'light' = (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
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
