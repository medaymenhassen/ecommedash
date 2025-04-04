import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObjectService {
  private jsonUrl = 'object_data.json';

  constructor(private http: HttpClient) { }

  getObjectData(): Observable<any> {
    return this.http.get<any>(this.jsonUrl);
  }
}
