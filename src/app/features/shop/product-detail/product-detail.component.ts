import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { Product } from '../../../models/product.interface';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productSvc = inject(ProductService);
  private readonly cartSvc = inject(CartService);
  private readonly toastSvc = inject(ToastService);

  product = signal<Product | null>(null);
  loading = signal(true);
  quantity = signal(1);
  imageLoaded = signal(false);
  imageFailed = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.toastSvc.error('ID de produit invalide.');
      this.router.navigate(['/shop']);
      return;
    }

    this.productSvc.get(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Produit introuvable.');
        this.router.navigate(['/shop']);
        this.loading.set(false);
      }
    });
  }

  incrementQuantity(): void {
    const max = this.product()?.stock?.quantite_disponible ?? 1;
    if (this.quantity() < max) {
      this.quantity.update(q => q + 1);
    } else {
      this.toastSvc.warning(`Quantité maximale disponible en stock atteinte (${max}).`);
    }
  }

  decrementQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod) return;

    const available = prod.stock?.quantite_disponible ?? 0;
    if (available <= 0) {
      this.toastSvc.error('Produit en rupture de stock.');
      return;
    }

    if (this.quantity() > available) {
      this.toastSvc.error('La quantité demandée dépasse le stock disponible.');
      return;
    }

    this.cartSvc.add(prod, this.quantity());
    this.toastSvc.success(`${this.quantity()} x "${prod.nom}" ajouté au panier.`);
  }

  getStockLabel(): string {
    const prod = this.product();
    if (!prod) return '';
    const qty = prod.stock?.quantite_disponible ?? 0;
    const min = prod.stock?.quantite_minimale ?? 5;
    if (qty <= 0) return 'Rupture de stock';
    if (qty <= min) return `Attention, stock très limité (${qty} restants)`;
    return `En stock (${qty} disponibles)`;
  }

  getStockClass(): string {
    const prod = this.product();
    if (!prod) return '';
    const qty = prod.stock?.quantite_disponible ?? 0;
    const min = prod.stock?.quantite_minimale ?? 5;
    if (qty <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (qty <= min) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }

  getCategoryIcon(categoryName?: string): string {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('raquette') || name.includes('balle') || name.includes('tennis') || name.includes('foot')) {
      return 'ti ti-ball';
    }
    if (name.includes('fitness') || name.includes('muscu') || name.includes('yoga') || name.includes('équipement')) {
      return 'ti ti-barbell';
    }
    if (name.includes('tenue') || name.includes('accessoire') || name.includes('vêtement') || name.includes('chaussure')) {
      return 'ti ti-shirt';
    }
    return 'ti ti-photo-off';
  }
}
