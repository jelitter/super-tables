import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JsonFetchService {
  constructor(private readonly http: HttpClient) {}

  public get(url: string): Promise<Object | null> {
    return lastValueFrom(this.http.get(url)).catch(() => {
      // return Promise.reject('Failed to fetch JSON');
      return null;
    });
  }
}
