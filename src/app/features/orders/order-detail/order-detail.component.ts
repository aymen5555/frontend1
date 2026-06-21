import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { Order } from '../../../models/order.interface';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderSvc = inject(OrderService);
  private readonly toastSvc = inject(ToastService);

  order = signal<Order | null>(null);
  loading = signal(true);

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
          this.loadOrderDetail(o.id); // Reload updated order status
        },
        error: (err) => {
          const errorMsg = err?.error?.message || err?.message || 'Erreur lors de l\'annulation de la commande.';
          this.toastSvc.error(errorMsg);
        }
      });
    }
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
