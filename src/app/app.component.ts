import { Component, HostListener } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CartService } from './cart.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs/internal/Observable';
import { CartOrderItem } from './auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'accounts';
  totalItemCount$!: Observable<number>;
  totalAmount$!: Observable<number>;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }
  getTotalItemCount(): number {
    return this.cartService.getTotalItemCount();
  }

  getTotalAmount(): number {
    return this.cartService.getTotalAmount();
  }

  isSticky: boolean = false;
  menuActive: boolean = false;
  showScrollBtn: boolean = false;
  cartItemCount: number = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isSticky = scrollPosition > 100; // Seuil pour le header sticky
    this.showScrollBtn = scrollPosition > 300; // Seuil pour le bouton de retour en haut
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

}
