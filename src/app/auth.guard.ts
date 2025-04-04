import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Injection du service AuthService
  const router = inject(Router); // Injection du service Router

  if (authService.isLoggedIn()) {
    return true; // L'utilisateur est connecté, autoriser l'accès
  } else {
    // L'utilisateur n'est pas connecté, redirection vers la page login
    router.navigate(['/register'], { queryParams: { returnUrl: state.url } });
    return false; // Bloquer l'accès
  }
};
