import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service'; // Assurez-vous que le chemin est correct
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const accessToken = localStorage.getItem('accessToken'); // Assurez-vous d’utiliser `localStorage` de façon cohérente

    let authReq = req;
    if (accessToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Si une erreur 401 est détectée, tentez de rafraîchir le token
          return this.handleRefreshToken(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handleRefreshToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.refreshToken().pipe(
      switchMap((response: { accessToken: string; refreshToken: string }) => {
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken); // Mettez à jour le token d'accès
          localStorage.setItem('refreshToken', response.refreshToken); // Mettez à jour le token de rafraîchissement

          // Clonez la requête d'origine avec le nouveau token d'accès
          const clonedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`
            }
          });
          return next.handle(clonedReq); // Réessayez la requête avec le nouveau token
        } else {
          console.error('Access token missing in response');
          this.authService.logout();
          return throwError(() => new Error('Access token missing in response'));
        }
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.authService.logout(); // Déconnexion si le rafraîchissement échoue
        return throwError(() => error);
      })
    );
  }

  private getCsrfToken(): string | null {
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null; // Décodez pour gérer les caractères spéciaux
  }

}
