import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.interface';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'ps_cart';

  // Signal state
  private readonly _items = signal<CartItem[]>(this.loadCart());

  // Exposed read-only views
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalItems = this.count; // alias used in navbar
  readonly total = computed(() => this._items().reduce((sum, item) => sum + (item.product.prix ?? 0) * item.quantity, 0));

  // Add item or increment quantity if already exists
  add(product: Product, quantity = 1): void {
    const current = this._items();
    const existingIndex = current.findIndex(item => item.product.id === product.id);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [...current, { product, quantity }];
    }

    this.saveCart(updated);
  }

  // Remove completely
  remove(productId: number): void {
    const updated = this._items().filter(item => item.product.id !== productId);
    this.saveCart(updated);
  }

  // Update quantity directly
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const updated = this._items().map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    );
    this.saveCart(updated);
  }

  // Clear cart
  clear(): void {
    this.saveCart([]);
  }

  // Helper method for total
  getTotal(): number {
    return this.total();
  }

  private saveCart(items: CartItem[]): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this._items.set(items);
  }

  private loadCart(): CartItem[] {
    const raw = localStorage.getItem(this.CART_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      localStorage.removeItem(this.CART_KEY);
      return [];
    }
  }
}
