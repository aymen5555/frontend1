import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { Order } from '../../../models/order.interface';
import { ReviewService } from '../../../services/review.service';
import { StarRatingComponent } from '../../../components/shared/star-rating/star-rating.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderSvc = inject(OrderService);
  private readonly toastSvc = inject(ToastService);
  private readonly reviewSvc = inject(ReviewService);
  public readonly auth = inject(AuthService);

  order = signal<Order | null>(null);
  loading = signal(true);

  // Per-product review state: keyed by produit_id
  reviewPanelOpen = signal<Record<number, boolean>>({});
  reviewRating = signal<Record<number, number>>({});
  reviewComment = signal<Record<number, string>>({});
  reviewSubmitting = signal<Record<number, boolean>>({});
  alreadyRated = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.toastSvc.error('ID de commande invalide.');
      this.router.navigate(['/my-orders']);
      return;
    }
    this.loadOrderDetail(id);
  }

  loadOrderDetail(id: number): void {
    this.loading.set(true);
    this.orderSvc.getMyOrderDetail(id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
        // Pre-check eligibility for each line item if order is delivered
        if (res.data?.statut === 'livree') {
          res.data.lignes?.forEach(ligne => {
            this.reviewSvc.getEligibility({ produit_id: ligne.produit_id }).subscribe({
              next: (e) => {
                if (e.already_rated) {
                  this.alreadyRated.update(prev => ({ ...prev, [ligne.produit_id]: true }));
                }
              },
              error: () => {}
            });
          });
        }
      },
      error: () => {
        this.toastSvc.error('Commande introuvable.');
        this.router.navigate(['/my-orders']);
        this.loading.set(false);
      }
    });
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;

    if (confirm('Voulez-vous vraiment annuler cette commande ? Les stocks des produits associés seront restitués.')) {
      this.orderSvc.cancelMyOrder(o.id).subscribe({
        next: () => {
          this.toastSvc.success('Commande annulée avec succès.');
          this.loadOrderDetail(o.id);
        },
        error: (err) => {
          const errorMsg = err?.error?.message || err?.message || 'Erreur lors de l\'annulation de la commande.';
          this.toastSvc.error(errorMsg);
        }
      });
    }
  }

  toggleReviewPanel(produitId: number): void {
    this.reviewPanelOpen.update(prev => ({ ...prev, [produitId]: !prev[produitId] }));
  }

  getRating(produitId: number): number {
    return this.reviewRating()[produitId] ?? 0;
  }

  setRating(produitId: number, value: number): void {
    this.reviewRating.update(prev => ({ ...prev, [produitId]: value }));
  }

  getComment(produitId: number): string {
    return this.reviewComment()[produitId] ?? '';
  }

  setComment(produitId: number, value: string): void {
    this.reviewComment.update(prev => ({ ...prev, [produitId]: value }));
  }

  submitProductReview(produitId: number): void {
    const rating = this.getRating(produitId);
    if (rating < 1) return;
    this.reviewSubmitting.update(prev => ({ ...prev, [produitId]: true }));
    this.reviewSvc.submitProductReview(produitId, rating, this.getComment(produitId)).subscribe({
      next: () => {
        this.toastSvc.success('Avis enregistré !');
        this.alreadyRated.update(prev => ({ ...prev, [produitId]: true }));
        this.reviewPanelOpen.update(prev => ({ ...prev, [produitId]: false }));
        this.reviewSubmitting.update(prev => ({ ...prev, [produitId]: false }));
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement de l\'avis.');
        this.reviewSubmitting.update(prev => ({ ...prev, [produitId]: false }));
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'en_attente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmee':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'preparee':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'livree':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'annulee':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en_attente': return 'En Attente';
      case 'confirmee': return 'Confirmée';
      case 'preparee': return 'Préparée';
      case 'livree': return 'Livrée';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  }

  getPaymentBadgeClass(status: string): string {
    return status === 'paye'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200';
  }

  getPaymentLabel(status: string): string {
    return status === 'paye' ? 'Payé' : 'Non Payé';
  }
}

