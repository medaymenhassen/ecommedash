import { Injectable } from '@angular/core';
import { CartOrderItem } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject: BehaviorSubject<CartOrderItem[]> = new BehaviorSubject<CartOrderItem[]>([]);
  public cartItems$: Observable<CartOrderItem[]> = this.cartItemsSubject.asObservable();

  constructor() {
    this.loadCartFromLocalStorage();
  }

  private loadCartFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') { // Vérifie si localStorage est défini
      const cart = localStorage.getItem('cartItems');
      if (cart) {
        this.cartItemsSubject.next(JSON.parse(cart));
      }
    }
  }

  private saveCartToLocalStorage(): void {
    if (typeof localStorage !== 'undefined') { // Vérifie si localStorage est défini
      localStorage.setItem('cartItems', JSON.stringify(this.cartItemsSubject.value));
    }
  }

  addToCart(item: CartOrderItem): void {
    const currentCart = this.cartItemsSubject.value;
    const existingItemIndex = currentCart.findIndex(ci => ci.attribute === item.attribute);

    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += item.quantity;
      currentCart[existingItemIndex].totalAmt = currentCart[existingItemIndex].price * currentCart[existingItemIndex].quantity;
    } else {
      currentCart.push(item);
    }

    this.cartItemsSubject.next(currentCart);
    this.saveCartToLocalStorage();
  }

  updateQuantity(attribute: string, quantity: number): void {
    const currentCart = this.cartItemsSubject.value;
    const itemIndex = currentCart.findIndex(ci => ci.attribute === attribute);

    if (itemIndex !== -1) {
      currentCart[itemIndex].quantity = quantity;
      currentCart[itemIndex].totalAmt = currentCart[itemIndex].price * quantity;
      this.cartItemsSubject.next(currentCart);
      this.saveCartToLocalStorage();
    }
  }

  removeItem(attribute: string): void {
    const currentCart = this.cartItemsSubject.value.filter(ci => ci.attribute !== attribute);
    this.cartItemsSubject.next(currentCart);
    this.saveCartToLocalStorage();
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.saveCartToLocalStorage();
  }

  getTotalAmount(): number {
    return this.cartItemsSubject.value.reduce((sum, item) => sum + item.totalAmt, 0)*1.3;
  }

  getTotalItemCount(): number {
    return this.cartItemsSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }
}

