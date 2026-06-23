import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ComplexeService } from '../../services/complexe.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { Product } from '../../models/product.interface';
import { Category } from '../../models/category.interface';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly cartSvc = inject(CartService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // States
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  complexes = signal<Complexe[]>([]);
  loading = signal(false);
  loadedImages = signal<Record<number, boolean>>({});
  failedImages = signal<Record<number, boolean>>({});

  // Sport Options list matching backend enums
  sports = [
    { value: 'football', label: 'Football' },
    { value: 'padel', label: 'Padel' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'natation', label: 'Natation' },
    { value: 'musculation', label: 'Musculation' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'handball', label: 'Handball' },
    { value: 'general', label: 'Général/Multi' }
  ];

  // Filter Form
  filterForm = this.fb.group({
    search: [''],
    categorie_id: [''],
    complexe_id: [''],
    sport_cible: ['']
  });

  ngOnInit(): void {
    this.loadFilters();
    this.loadProducts();

    // Reload products automatically when filters change
    this.filterForm.valueChanges.subscribe(() => {
      this.loadProducts();
    });
  }

  loadFilters(): void {
    this.categorySvc.list().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.toastSvc.error('Erreur lors du chargement des catégories.')
    });

    this.complexeSvc.list().subscribe({
      next: (res) => this.complexes.set(res),
      error: () => this.toastSvc.error('Erreur lors du chargement des complexes.')
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const formVals = this.filterForm.value;
    const filters = {
      search: formVals.search || undefined,
      categorie_id: formVals.categorie_id ? Number(formVals.categorie_id) : undefined,
      complexe_id: formVals.complexe_id ? Number(formVals.complexe_id) : undefined,
      sport_cible: formVals.sport_cible || undefined
    };

    this.productSvc.list(filters).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement des produits.');
        this.loading.set(false);
      }
    });
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    // Check availability
    const stockQty = product.stock?.quantite_disponible ?? 0;
    if (stockQty <= 0) {
      this.toastSvc.warning('Ce produit est en rupture de stock.');
      return;
    }

    this.cartSvc.add(product, 1);
    this.toastSvc.success(`"${product.nom}" ajouté au panier.`);
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  getStockLabel(product: Product): string {
    const qty = product.stock?.quantite_disponible ?? 0;
    const min = product.stock?.quantite_minimale ?? 5;
    if (qty <= 0) return 'Rupture';
    if (qty <= min) return `Stock faible: ${qty}`;
    return `En stock (${qty})`;
  }

  getStockBadgeClass(product: Product): string {
    const qty = product.stock?.quantite_disponible ?? 0;
    const min = product.stock?.quantite_minimale ?? 5;
    if (qty <= 0) return 'bg-red-50 text-red-700 border-red-200';
    if (qty <= min) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  onImageLoad(id: number): void {
    this.loadedImages.update(prev => ({ ...prev, [id]: true }));
  }

  onImageError(id: number): void {
    this.failedImages.update(prev => ({ ...prev, [id]: true }));
  }

  isImageLoaded(id: number): boolean {
    return !!this.loadedImages()[id];
  }

  isImageFailed(id: number): boolean {
    return !!this.failedImages()[id];
  }

  getCategoryIcon(categoryName?: string): string {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('raquette') || name.includes('balle')) {
      return 'ti ti-ball-tennis';
    }
    if (name.includes('fitness') || name.includes('muscu') || name.includes('yoga') || name.includes('équipement')) {
      return 'ti ti-barbell';
    }
    if (name.includes('tenue') || name.includes('accessoire') || name.includes('vêtement')) {
      return 'ti ti-shirt';
    }
    return 'ti ti-package';
  }

  /** Returns array of 5 star types for a given rating (0-5) */
  getStars(rating: number | null | undefined): ('full' | 'half' | 'empty')[] {
    if (!rating) return ['empty', 'empty', 'empty', 'empty', 'empty'];
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }
}
