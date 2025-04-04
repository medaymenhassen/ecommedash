import { Attribute, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { isPlatformBrowser } from '@angular/common';
import { NgZone } from '@angular/core';
import { AuthService, Product } from './auth.service';
export enum SubscriptionType {
  BASIC = 'BASIC',
  GOLD = 'GOLD',
  PREMIUM = 'PREMIUM'
}
export class Supply {
  id?: number;
  name!: string;
  email!: string;
  product?: Product;
  totalAmt?: number;
}
export interface Company {
  id?: number;
  name: string;
  subscription: SubscriptionType;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

interface CustomJwtPayload {
  exp: number; // Timestamp de l'expiration
  userId?: number; // ID utilisateur, optionnel
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  // Ajoutez d'autres propriétés utilisateur selon vos besoins
}
export interface JwtPayload {
  userId: number;
  username: string;
  // Ajoutez d'autres propriétés du payload si nécessaire
}


@Injectable({
  providedIn: 'root'
})
export class UsercompanyService {
  private baseUrl = 'http://localhost:8080/api/customer-orders';
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private authService: AuthService
  ) {
    
  }
  register(authRequest: AuthenticationRequest): Observable<any> {
    const url = `${this.baseUrl}/register`; // Assurez-vous que l'URL est correcte
    return this.http.post(url, authRequest, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(response => {
        console.log('Registration successful:', response);
        return response;
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error('Registration failed'));
      })
    );
  }
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }





  private getHeaderswith(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }













  
  // Créer une entreprise
  createCompany(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/company/create`, formData, {
      headers: this.authService.getHeadersWithoutContentType()
    });
  }

  // Supprimer une entreprise
  deleteCompany(companyId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/company/delete/${companyId}`, {
      headers: this.authService.getHeadersWithoutContentType()
    });
  }

  updateCompany(companyId: number, updateData: any): Observable<any> {
    let params = new HttpParams();

    // Ajouter uniquement les valeurs non nulles
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== null && updateData[key] !== undefined) {
        params = params.append(key, updateData[key]);
      }
    });

    return this.http.put(`${this.baseUrl}/company/update/${companyId}`, null, {
      headers: this.authService.getHeadersWithoutContentType(),
      params: params
    });
  }


  generateAccessLink(companyId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/company/generate-invite/${companyId}`, {}, {
      headers: this.authService.getHeadersWithoutContentType(),
    });
  }

  joinCompanyByToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/company/join/${token}`, {
      headers: this.getHeaders()
    });
  }

  getUserCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/company/list`, {
      headers: this.authService.getHeadersWithoutContentType(),
    });
  }


  // CREATE
  createSupply(supply: Supply): Observable<Supply> {
    return this.http.post<Supply>(`${this.baseUrl}/supply`, supply, {
      headers: this.authService.getHeadersWithoutContentType()
    });
  }

  // READ ALL
  getAllSupplies(): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.baseUrl}/supply`, {
      headers: this.authService.getHeadersWithoutContentType()
    });
  }

  updateSupply(id: number, updateData: Partial<Supply>): Observable<Supply> {
    return this.http.put<Supply>(`${this.baseUrl}/supply/${id}`, updateData, {
      headers: this.getHeaders(), // Garder les headers
    });
  }

  // DELETE
  deleteSupply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/supply/${id}`, {
      headers: this.getHeaders()
    });
  }
}
