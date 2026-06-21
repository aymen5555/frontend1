import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService, CartItem } from '../../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  readonly cartSvc = inject(CartService);
  private readonly router = inject(Router);

  // Read signals from CartService
  cartItems = this.cartSvc.items;
  cartCount = this.cartSvc.count;
  cartTotal = this.cartSvc.total;

  updateQuantity(productId: number, newQty: number, maxQty: number): void {
    if (newQty > maxQty) {
      return;
    }
    this.cartSvc.updateQuantity(productId, newQty);
  }

  removeItem(productId: number): void {
    this.cartSvc.remove(productId);
  }

  clearCart(): void {
    if (confirm('Voulez-vous vraiment vider votre panier ?')) {
      this.cartSvc.clear();
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems().length === 0) return;
    this.router.navigate(['/checkout']);
  }
}
