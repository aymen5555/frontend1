import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toast.service';
import { Product } from '../../../models/product.interface';
import { AuthService } from '../../../services/auth.service';
import { ReviewService, Review } from '../../../services/review.service';
import { StarRatingComponent } from '../../../components/shared/star-rating/star-rating.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productSvc = inject(ProductService);
  private readonly cartSvc = inject(CartService);
  private readonly toastSvc = inject(ToastService);
  public readonly auth = inject(AuthService);
  private readonly reviewSvc = inject(ReviewService);

  product = signal<Product | null>(null);
  reviews = signal<Review[]>([]);
  isEligible = signal(false);
  alreadyRated = signal(false);
  newRating = signal(0);
  newCommentaire = '';
  submittingReview = signal(false);
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
        this.loadReviews(id);
        this.checkEligibility(id);
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

  loadReviews(id: number): void {
    this.reviewSvc.getProductReviews(id).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => console.error('Error fetching product reviews')
    });
  }

  checkEligibility(id: number): void {
    if (this.auth.isLoggedIn()) {
      this.reviewSvc.getEligibility({ produit_id: id }).subscribe({
        next: (res) => {
          this.isEligible.set(res.eligible);
          this.alreadyRated.set(res.already_rated);
        },
        error: () => console.error('Error checking rating eligibility')
      });
    }
  }

  submitReview(): void {
    const rating = this.newRating();
    if (rating < 1 || rating > 5 || this.submittingReview()) return;
    this.submittingReview.set(true);
    const id = this.product()?.id;
    if (!id) return;
    this.reviewSvc.submitProductReview(id, rating, this.newCommentaire).subscribe({
      next: () => {
        this.toastSvc.success('Votre avis a été enregistré.');
        this.newRating.set(0);
        this.newCommentaire = '';
        this.submittingReview.set(false);
        this.loadReviews(id);
        this.checkEligibility(id);
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement de votre avis');
        this.submittingReview.set(false);
      }
    });
  }

  deleteReview(reviewId: number): void {
    if (confirm('Voulez-vous supprimer cet avis ?')) {
      this.reviewSvc.deleteProductReview(reviewId).subscribe({
        next: () => {
          this.toastSvc.success('Avis supprimé.');
          const id = this.product()?.id;
          if (id) {
            this.loadReviews(id);
            this.checkEligibility(id);
          }
        },
        error: () => this.toastSvc.error('Erreur lors de la suppression de l\'avis.')
      });
    }
  }
}
