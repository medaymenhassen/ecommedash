import { Attribute, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { isPlatformBrowser } from '@angular/common';
import { NgZone } from '@angular/core';
import { AuthService, Product } from './auth.service';

export class HistoryProduct {
  id!: number;
  product!: Product; // Assurez-vous que le modèle Product existe
  supply!: Supply;   // Assurez-vous que le modèle Supply existe
  message!: string;
  dateEvent!: string; // Utilisez `string` pour les dates (format ISO)
  quantity!: number;
}

export enum SubscriptionType {
  BASIC = 'BASIC',
  GOLD = 'GOLD',
  PREMIUM = 'PREMIUM'
}

export interface Supply {
  id?: number;
  name: string;
  email: string;
  totalAmt: number;
  companiesIds?: number[];  // Ajout de la propriété
  products?: Product[];      // Correction aussi ici
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


  createSupply(formData: FormData): Observable<Supply> {
    return this.http.post<Supply>(`${this.baseUrl}/supply`, formData, {
      headers: this.getHeaders()  // You can pass headers if needed, like Authorization
    });
  }
  // UPDATE (with FormData)
  updateSupply(id: number, formData: FormData): Observable<Supply> {
    return this.http.put<Supply>(`${this.baseUrl}/supply/${id}`, formData, {
      headers: this.getHeaders()  // Keep your authorization headers
    });
  }

  getSuppliesByCompanyId(companyId: number): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.baseUrl}/supply/filter/${companyId}`, {
      headers: this.getHeaderswith(),  // You can pass headers if needed, like Authorization
    })

  }


  // DELETE
  deleteSupply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/supply/${id}`, {
      headers: this.getHeaders()
    });
  }




  createProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products/create`, formData, {
      headers: this.getHeaders()
    });
  }

  // Mettre à jour un produit
  updateProduct(id: number, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/update/${id}`, formData, {
      headers: this.getHeaders()
    });
  }

  // Supprimer un produit
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/delete/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Récupérer les produits par entreprise
  getProductsByCompany(supplyId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/filter/${supplyId}`, {
      headers: this.getHeaders()
    });
  }

  updateProductQuantity(
    productId: string,
    title: string,
    quantityToUpdate: number,
    lifo: boolean,
    supplyId: number
  ): Observable<any> {
    const params = {
      specificProductId: productId, // Nouveau paramètre
      quantityToUpdate: quantityToUpdate.toString(),
      title: title,
      lifo: lifo.toString(),
      supplyId: supplyId
    };
    console.table(params);
    return this.http.put<any>(`${this.baseUrl}/products/update-quantity`, null, {
      headers: this.getHeaders(),
      params: params
    });
  }

  getCompanysBySupply(supplyId: number): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/companysupply/filter/${supplyId}`, {
      headers: this.getHeaders()
    });
  }

  getGrapgicsBySupply(supplyId: number): Observable<HistoryProduct[]> {
    return this.http.get<HistoryProduct[]>(`${this.baseUrl}/products/graphic/${supplyId}`, {
      headers: this.getHeaders()
    });
  }

}
