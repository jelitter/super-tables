import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { JsonFetchService } from 'src/services/json-fetch.service';
import { TablesComponent } from './tables.component';

describe('TablesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientModule, NoopAnimationsModule],
      declarations: [TablesComponent],
      providers: [JsonFetchService, HttpClient]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(TablesComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render copy button', () => {
    const fixture = TestBed.createComponent(TablesComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#copy-button')?.textContent).toContain('Copy');
  });
});
