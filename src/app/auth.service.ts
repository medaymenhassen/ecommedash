import { Attribute, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, catchError, map, tap, throwError } from 'rxjs';
import { jwtDecode } from "jwt-decode";
import { isPlatformBrowser } from '@angular/common';
import { NgZone } from '@angular/core';
import { Company } from './usercompany.service';


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
  owner?: Company;
  workCompanies: Company[];
}

export interface JwtPayload {
  userId: number;
  username: string;
  // Ajoutez d'autres propriétés du payload si nécessaire
}

// product.model.ts
export interface Product {
  id?: number;
  title: string;
  description?: string;
  sku: string;
  lifo: boolean;
  qte: number;
  price: number;
  categorie?: string;
  marque?: string;
  debut: string;
  datePeremption?: string;
  dateFabrication?: string;
  lotNumber?: string;
  codeBarre?: string;
  stockMinimum?: number;
  userId: number;
  supplyId?: number;
  costManufacturing: number;
  costCommercialization: number;
  imageUrl?: string;           // <--- Nouveau
  user?: User; // <-- Pour accéder à user.owner.id

}

export interface Category {
  id: number; // Ensure `id` is always defined
  title: string;
  slug: string;
  specs: string;
  imagePath?: string;
}

export interface Brand {
  id: number; // Ensure `id` is always defined
  title: string;
  slug: string;
  specs: string;
  imagePath?: string;
}

export interface Color {
  id: number; // Ensure id is always defined
  title: string;
  colorCode: string; // Assurez-vous que ce nom est correct et correspond à votre API
  mission: string;
}

export interface Size {
  id: number; // Ensure id is always defined
  title: string;
}
export interface Length {
  id: number; // Ensure id is always defined
  title: number;
}

export interface ProductAttribute {
  id?: number;
  userId: number;
  color: Color;
  size: Size;
  length?: Length; // Optional
  price: number;
  qte: number;

  detail?: string;
  text?: string;
  sales: number;
  product: Product;
  imagePath?: string;
  texturePath?: string;
  videoPath?: string;
}

// shop-address.model.ts
export interface ShopAddress {
  id?: number; // ? signifie que ce champ est optionnel
  userId: number; // ID de l'utilisateur associé
  address: string;
  email: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone: number;
  cardname: string;
  cardnum: number;
  cardexp: string; // ou Date si vous préférez
  cvv: number;
  status: boolean;
  added?: Date; // Date d'ajout, optionnel
}

export interface CartOrderItems {
  order: Order;                    // Assuming Order is another defined interface
  items: CartOrderItem[];         // Array of CartOrderItem
}

export interface Order {
  id?: number;
  orderId?: string; // Assuming orderId should be a string based on the backend
  orderStatus: boolean;
  paidStatus?: string;
  totalAmt: number;
  created?: Date;
  userId: number; // Reference to the user
}

export interface CartOrderItem {
  id?: number;
  item: string;
  imagePath?: string;
  attribute: string; // Description combined attributes
  quantity: number;
  price: number;
  totalAmt: number;
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'https://www.cognitiex.com/api';
  private readonly ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 15;
  private readonly REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7;

    constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) private platformId: Object,
      private ngZone: NgZone
    ) {
      this.setupAutoRefresh();
      if (this.isLoggedIn() && !sessionStorage.getItem('tokenRefreshed')) {
        this.initialRefreshToken();
      }
    }

    private initialRefreshToken() {
      this.refreshToken().subscribe({
        next: () => {
          // Marquer comme rafraîchi pour éviter de rappeler cette méthode dans la même session
          sessionStorage.setItem('tokenRefreshed', 'true');

          // Recharger la page si le rafraîchissement du token est réussi et si ce n'est pas encore fait dans cette session
          if (isPlatformBrowser(this.platformId) && !sessionStorage.getItem('pageReloaded')) {
            this.ngZone.runOutsideAngular(() => {
              sessionStorage.setItem('pageReloaded', 'true'); // Marquer comme rechargé
              location.reload();
            });
          }
        },
        error: () => {
          this.logout(); // Déconnectez l'utilisateur si le rafraîchissement échoue
        }
      });
    }



  private decodeToken(token: string): CustomJwtPayload | null {

    try {
      return jwtDecode<CustomJwtPayload>(token);
    } catch (error) {
      console.error('Token decoding failed', error);
      return null;
    }
  }

  private isAccessTokenCloseToExpiration(): boolean {
    const accessToken = this.getToken();
    if (!accessToken) {
      return false; // Considérez que le token n'est pas proche de l'expiration
    }
    const decodedToken = this.decodeToken(accessToken);
    return decodedToken ? (decodedToken.exp * 1000 - Date.now() < 2 * 60 * 1000) : false;
  }


  public getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;

  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private storeNewAccessToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', token);
    }
  }

  // Dans AuthService
  public storeNewRefreshToken(token: string) { // Changez "private" en "public" ici
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('refreshToken', token);
    }
  }

  public logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken(); // Assurez-vous que cette méthode existe
    const username = this.getUsernameFromToken(); // Récupérez le nom d'utilisateur

    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.baseUrl}/refresh-token`,
      { refreshToken, username } // Envoyer le refresh token et le nom d'utilisateur
    )
      .pipe(
        tap(response => {
          this.storeNewAccessToken(response.accessToken);
          this.storeNewRefreshToken(response.refreshToken);
        }),
        catchError(error => {
          this.logout(); // Déconnectez l'utilisateur si le rafraîchissement échoue
          return EMPTY;
        })
      );
  }


  deleteUser(): Observable<string> {
    const accessToken = this.getToken();
    if (!accessToken) throw new Error('No access token found');

    const userId = this.getUserIdFromToken(accessToken);
    if (userId === null) throw new Error('No user ID found in token');

    return this.http.delete(`${this.baseUrl}/delete/${userId}`, {
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  private setupAutoRefresh() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        setInterval(() => {
          if (this.isAccessTokenCloseToExpiration()) {
            this.refreshToken().subscribe({
              next: (newTokens) => {
              },
              error: (error) => {
                this.logout(); // Déconnexion si le rafraîchissement échoue
              }
            });
          }
        }, 2 * 60 * 1000); // Vérification toutes les 30 secondes
      });
    }
  }

  private isRefreshTokenExpired(): boolean {
    const refreshToken = this.getRefreshToken();
    const decodedToken = this.decodeToken(refreshToken || '');
    return decodedToken ? decodedToken.exp * 1000 < Date.now() : true;
  }

  public getUserIdFromToken(token: string): number | null {
    const decodedToken = this.decodeToken(token);
    return decodedToken?.userId || null;
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getUsernameFromToken(): string | null {
    const token = this.getToken();
    try {
      return JSON.parse(atob(token?.split('.')[1] || '')).sub || null;
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }
  getHeadersWithoutContentType() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken() }`
      // Ne pas inclure 'Content-Type'
    });
    return headers;
  }

  register(authenticationRequest: AuthenticationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, authenticationRequest, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  authenticate(authRequest: AuthenticationRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/authenticate`, authRequest).pipe(
      catchError((error) => {
        return throwError(() => new Error('Error during authentication'));
      })
    );
  }
  // Stockage du token lors de la connexion
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', token); // Utilisez localStorage si c'est ce que vous avez choisi
    }
  }




  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const username = this.getUsernameFromToken();
    if (!username) {
      throw new Error('No username found in token');
    }

    const body = {
      oldPassword,
      newPassword
    };

    return this.http.put<any>(`${this.baseUrl}/change-password/${username}`, body, {
      headers: this.getHeaders()
    });
  }

  submitContactForm(contact: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/submit`, contact);
  }

  /*
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products/user`, {
      headers: this.getHeaders()
    });
  }



  // Récupérer un produit par ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`,{
      headers: this.getHeaders()
    });
  }

  // Créer un nouveau produit
  createProduct(
    product: Product,
    files: { gltfPath?: File | null; binPath?: File | null; texturePath?: File | null }
  ): Observable<any> {
    const formData = new FormData();

    // Créer un objet contenant uniquement les IDs
    const ids = {
      categoryId: product.category?.id,
      brandId: product.brand?.id
    };

    if (!ids.categoryId) {
      throw new Error('Category is not defined or has no id');
    }
    if (!ids.brandId) {
      throw new Error('Brand is not defined or has no id');
    }

    // Ajouter les IDs en tant que paramètres
    formData.append('categoryId', ids.categoryId.toString());
    formData.append('brandId', ids.brandId.toString());
    
    // Ajouter les champs de produit
    formData.append('title', product.title);
    formData.append('slug', product.slug);
    formData.append('specs', product.specs || '');
    formData.append('status', product.status.toString());
    formData.append('isFeatured', product.isFeatured.toString());
    formData.append('debut', product.debut || '');
    formData.append('fin', product.fin || '');

    // Ajouter les fichiers à formData si existants
    if (files.gltfPath) {
      formData.append('gltfPath', files.gltfPath);
    }
    if (files.binPath) {
      formData.append('binPath', files.binPath);
    }
    if (files.texturePath) {
      formData.append('texturePath', files.texturePath);
    }

    return this.http.post(`${this.baseUrl}/products/create`, formData, {
      headers: this.getHeadersWithoutContentType()
    });
  }

  // Mettre à jour un produit existant
  updateProduct(
    id: number,
    product: Product,
    files: { gltfPath?: File | null; binPath?: File | null; texturePath?: File | null }
  ): Observable<Product> {
    const formData = new FormData();

    // Créer un objet contenant uniquement les IDs
    const ids = {
      categoryId: product.category?.id,
      brandId: product.brand?.id,
    };

    // Validation des IDs
    if (!ids.categoryId || !ids.brandId) {
      throw new Error('Category or Brand is not defined or has no id');
    }

    // Ajouter les IDs en tant que paramètres
    formData.append('categoryId', ids.categoryId.toString());
    formData.append('brandId', ids.brandId.toString());

    // Ajouter les champs de produit
    formData.append('title', product.title);
    formData.append('slug', product.slug);
    formData.append('specs', product.specs || '');
    formData.append('status', product.status.toString());
    formData.append('isFeatured', product.isFeatured.toString());
    formData.append('debut', product.debut || '');
    formData.append('fin', product.fin || '');

    // Ajouter les fichiers à formData si existants
    if (files.gltfPath) {
      formData.append('gltfPath', files.gltfPath);
    }
    if (files.binPath) {
      formData.append('binPath', files.binPath);
    }
    if (files.texturePath) {
      formData.append('texturePath', files.texturePath);
    }

    return this.http.put<Product>(`${this.baseUrl}/products/update/${id}`, formData, {
      headers: this.getHeadersWithoutContentType(),
    }).pipe(
      catchError(error => {
        console.error('Error updating product:', error);
        return throwError('Failed to update product; please try again later.');
      })
    );
  }


  // Supprimer un produit
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/delete/${id}`, {
      headers: this.getHeaders()
    });
  }
  createCategory(formData: FormData): Observable<Category> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.post<Category>(`${this.baseUrl}/categories/create`, formData, { headers });
  }
  */
  // Méthode pour obtenir toutes les catégories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories/liste`, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour obtenir une catégorie par ID
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/categories/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour mettre à jour une catégorie
  updateCategory(id: number, formData: FormData): Observable<Category> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.put<Category>(`${this.baseUrl}/categories/update/${id}`, formData, {
      headers
    });
  }


  // Méthode pour supprimer une catégorie
  deleteCategory(id: number): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.delete<void>(`${this.baseUrl}/categories/delete/${id}`, {
      headers
    });
  }

  createBrand(formData: FormData): Observable<Brand> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.post<Brand>(`${this.baseUrl}/brand/create`, formData, { headers });
  }

  // Méthode pour obtenir toutes les catégories
  getBrand(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.baseUrl}/brand/liste`, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour obtenir une catégorie par ID
  getBrandById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.baseUrl}/brand/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour mettre à jour une catégorie
  updateBrand(id: number, formData: FormData): Observable<Brand> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.put<Brand>(`${this.baseUrl}/brand/update/${id}`, formData, {
      headers
    });
  }
  


  // Méthode pour supprimer une catégorie
  deleteBrand(id: number): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http.delete<void>(`${this.baseUrl}/brand/delete/${id}`, {
      headers
    });
  }

  getColor(): Observable<Color[]> {
    return this.http.get<Color[]>(`${this.baseUrl}/color/list`, {
      headers: this.getHeaders()
    });
  }


  getColorById(id: number): Observable<Color> {
    return this.http.get<Color>(`${this.baseUrl}/color/${id}`, {
      headers: this.getHeaders()
    });
  }

  createColor(color: Color): Observable<any> {
    return this.http.post(`${this.baseUrl}/color/create`, color, {
      headers: this.getHeaders()
    });
  }

  updateColor(id: number, color: Color): Observable<Color> {
    return this.http.put<Color>(`${this.baseUrl}/color/update/${id}`, color, {
      headers: this.getHeaders()
    });
  }

  deleteColor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/color/delete/${id}`, {
      headers: this.getHeaders()
    });
  }

  getSize(): Observable<Size[]> {
    return this.http.get<Size[]>(`${this.baseUrl}/size/list`, {
      headers: this.getHeaders()
    });
  }


  getSizeById(id: number): Observable<Size> {
    return this.http.get<Size>(`${this.baseUrl}/size/${id}`, {
      headers: this.getHeaders()
    });
  }

  createSize(size: Size): Observable<any> {
    return this.http.post(`${this.baseUrl}/size/create`, size, {
      headers: this.getHeaders()
    });
  }

  updateSize(id: number, size: Size): Observable<Size> {
    return this.http.put<Size>(`${this.baseUrl}/size/update/${id}`, size, {
      headers: this.getHeaders()
    });
  }

  deleteSize(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/size/delete/${id}`, {
      headers: this.getHeaders()
    });
  }



  getLength(): Observable<Length[]> {
    return this.http.get<Length[]>(`${this.baseUrl}/length/list`, {
      headers: this.getHeaders()
    });
  }


  getLengthById(id: number): Observable<Length> {
    return this.http.get<Length>(`${this.baseUrl}/length/${id}`, {
      headers: this.getHeaders()
    });
  }

  createLength(length: Length): Observable<any> {
    return this.http.post(`${this.baseUrl}/length/create`, length, {
      headers: this.getHeaders()
    });
  }

  updateLength(id: number, length: Length): Observable<Length> {
    return this.http.put<Length>(`${this.baseUrl}/length/update/${id}`, length, {
      headers: this.getHeaders()
    });
  }

  deleteLength(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/length/delete/${id}`, {
      headers: this.getHeaders()
    });
  }








  getImage(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/images/${fileName}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
  getImageUrl(fileName: string): string {
    return `${this.baseUrl}/images/${fileName}`;
  }
  getVideo(fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/video/${fileName}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
  getVideoUrl(fileName: string): string {
    return `${this.baseUrl}/video/${fileName}`;
  }
  getProductAttribute(): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttribute[]>(`${this.baseUrl}/attribut/list`, {
      headers: this.getHeaders()
    });
  }

  getProductAttributeUser(): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttribute[]>(`${this.baseUrl}/attribut/user`, {
      headers: this.getHeaders()
    });
  }

  getProductAttributeById(id: number): Observable<ProductAttribute> {
    return this.http.get<ProductAttribute>(`${this.baseUrl}/attribut/${id}`, {
      headers: this.getHeaders()
    });
  }

  createProductAttribute(
    productAttribute: ProductAttribute,
    files: { imagePath?: File; texturePath?: File; videoPath?: File }
  ): Observable<any> {
    const formData = new FormData();

    // Créer un objet contenant uniquement les IDs
    const colorId = productAttribute.color?.id;
    const sizeId = productAttribute.size?.id;
    const lengthId = productAttribute.length?.id;
    const productId = productAttribute.product?.id;
    // Vérifier les IDs requis
    if (!colorId) {
      throw new Error('Color is not defined or has no id');
    }
    if (!sizeId) {
      throw new Error('Size is not defined or has no id');
    }
    if (!productId) {
      throw new Error('Product is not defined or has no id');
    }

    // Ajouter les IDs en tant que paramètres
    formData.append('colorId', colorId.toString());
    formData.append('sizeId', sizeId.toString());
    formData.append('productId', productId.toString());

    if (lengthId) {
      formData.append('lengthId', lengthId.toString());
    }

    // Ajouter l'objet ProductAttribute en tant que JSON
    const attributeData = {
      price: productAttribute.price,
      qte: productAttribute.qte,
      sales: productAttribute.sales,
      text: productAttribute.text,
      detail: productAttribute.detail
      // Ajoutez d'autres champs si nécessaire
    };
    if (!attributeData.detail) {
      console.warn('Le champ "detail" est vide ou non défini', attributeData);
    } else {
      console.log('Données envoyées avec le détail:', attributeData);
    }

    formData.append('productAttribute', new Blob([JSON.stringify(attributeData)], { type: 'application/json' }));

    // Ajouter les fichiers
    if (files.imagePath) {
      formData.append('imagePath', files.imagePath);
    }
    if (files.texturePath) {
      formData.append('texturePath', files.texturePath);
    }
    if (files.videoPath) {
      formData.append('videoPath', files.videoPath);
    }

    return this.http.post(`${this.baseUrl}/attribut/create`, formData, {
      // Ne pas définir manuellement 'Content-Type', laissez le navigateur le faire
      headers: this.getHeadersWithoutContentType()
    });
  }

  updateProductAttribute(
    id: number,
    productAttribute: ProductAttribute,
    files: { imagePath?: File; texturePath?: File; videoPath?: File }
  ): Observable<ProductAttribute> {
    const formData = new FormData();

    // Créer un objet contenant uniquement les IDs
    const ids = {
      colorId: productAttribute.color?.id,
      sizeId: productAttribute.size?.id,
      lengthId: productAttribute.length?.id,
      productId: productAttribute.product?.id

    };

    // Vérifier les IDs requis
    if (!ids.colorId) {
      throw new Error('Color is not defined or has no id');
    }
    if (!ids.sizeId) {
      throw new Error('Size is not defined or has no id');
    }
    if (!ids.productId) {
      throw new Error('product is not defined or has no id');
    }

    // Ajouter les IDs en tant que paramètres
    formData.append('colorId', ids.colorId.toString());
    formData.append('sizeId', ids.sizeId.toString());
    formData.append('productId', ids.productId.toString());
    
    if (ids.lengthId) {
      formData.append('lengthId', ids.lengthId.toString());
    }

    // Ajouter l'objet ProductAttribute en tant que JSON
    const attributeData = {
      price: productAttribute.price,
      qte: productAttribute.qte,
      sales: productAttribute.sales,
      text: productAttribute.text,
      detail: productAttribute.detail
    };
    if (!attributeData.detail) {
      console.warn('Le champ "detail" est vide ou non défini', attributeData);
    } else {
      console.log('Données envoyées avec le détail:', attributeData);
    }

    formData.append('productAttribute', new Blob([JSON.stringify(attributeData)], { type: 'application/json' }));

    // Ajouter les fichiers
    if (files.imagePath) {
      formData.append('imagePath', files.imagePath);
    }
    if (files.texturePath) {
      formData.append('texturePath', files.texturePath);
    }
    if (files.videoPath) {
      formData.append('videoPath', files.videoPath);
    }

    return this.http.put<ProductAttribute>(`${this.baseUrl}/attribut/update/${id}`, formData, {
      // Ne pas définir manuellement 'Content-Type', laissez le navigateur le faire
      headers: this.getHeadersWithoutContentType()
    });
  }


  deleteProductAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/attribut/delete/${id}`, {
      headers: this.getHeaders()
    });
  }

  createShopAddress(shopAddress: ShopAddress): Observable<ShopAddress> {
    return this.http.post<ShopAddress>(`${this.baseUrl}/address/create`, shopAddress, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour récupérer toutes les adresses de magasin d'un utilisateur
  getShopAddressesByUserId(userId: number): Observable<ShopAddress[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}` // Ajoutez le token ici
    });

    return this.http.get<ShopAddress[]>(`${this.baseUrl}/address/user`, { headers });
  }


  // Méthode pour récupérer une adresse de magasin par ID
  getShopAddressById(id: number): Observable<ShopAddress> {
    return this.http.get<ShopAddress>(`${this.baseUrl}/address/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour mettre à jour une adresse de magasin
  updateShopAddress(id: number, shopAddress: ShopAddress): Observable<ShopAddress> {
    return this.http.put<ShopAddress>(`${this.baseUrl}/address/${id}/update`, shopAddress, {
      headers: this.getHeaders()
    });
  }

  // Méthode pour supprimer une adresse de magasin
  deleteShopAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/address/${id}/delete`, {
      headers: this.getHeaders()
    });
  }

  getProductAttributes(): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttribute[]>(`${this.baseUrl}/attribut/product/list`, {
      headers: this.getHeaders() // Ajout de l'en-tête avec le token
    }).pipe(
      map(attributes => attributes.filter(attr => attr.qte > 0)) // Filtre les attributs avec qte > 0
    );
  }

  createOrder(items: CartOrderItem[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/order/create`, items, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error occurred while creating order:', error);
        return throwError(error);
      })
    );
  }
  getProductdetailWithAttributes(slug: string): Observable<{ product: Product, attributes: ProductAttribute[] }> {
    return this.http.get<{ product: Product, attributes: ProductAttribute[] }>(`${this.baseUrl}/products/detail/${slug}`);
  }

  sendMessage(message: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/chat`, { message }, {
      headers: this.getHeaders()  // Vérifiez que le token est bien inclus
    });
  }
}
