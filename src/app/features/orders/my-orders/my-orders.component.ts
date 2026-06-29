import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { Order } from '../../../models/order.interface';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly toastSvc = inject(ToastService);
  private readonly reviewSvc = inject(ReviewService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  eligibleProduits = signal<number[]>([]);

  ngOnInit(): void {
    this.loadOrders();
    this.reviewSvc.getEligibleList().subscribe({
      next: (list) => {
        this.eligibleProduits.set(list.eligible_produits || []);
      },
      error: () => {}
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderSvc.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement de vos commandes.');
        this.loading.set(false);
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

  hasReviewableItems(order: Order): boolean {
    const eligibleIds = this.eligibleProduits();
    return order.lignes?.some(ligne => eligibleIds.includes(ligne.produit_id)) ?? false;
  }
}
