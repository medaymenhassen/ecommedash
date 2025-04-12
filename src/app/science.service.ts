import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScienceService {
  private baseUrl = 'https://www.cognitiex.com/py/assistance/';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }


  sendMessage(message: string): Observable<any> {
    const payload = { message };
    return this.http.post<any>(`${this.baseUrl}chat/`, payload);
  }

}
