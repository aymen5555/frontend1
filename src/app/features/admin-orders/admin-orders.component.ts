import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';
import { StatusDialogComponent } from './status-dialog/status-dialog.component';
import { PaymentDialogComponent } from './payment-dialog/payment-dialog.component';
import { Order } from '../../models/order.interface';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly toastSvc = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  orders = signal<Order[]>([]);
  loading = signal(true);

  filterForm = this.fb.group({
    statut: [''],
    statut_paiement: [''],
    date_from: [''],
    date_to: ['']
  });

  statuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En Attente' },
    { value: 'confirmee', label: 'Confirmée' },
    { value: 'preparee', label: 'Préparée' },
    { value: 'livree', label: 'Livrée' },
    { value: 'annulee', label: 'Annulée' }
  ];

  paymentStatuses = [
    { value: '', label: 'Tous' },
    { value: 'non_paye', label: 'Non Payé' },
    { value: 'paye', label: 'Payé' }
  ];

  ngOnInit(): void {
    this.loadOrders();
    this.filterForm.valueChanges.subscribe(() => this.loadOrders());
  }

  loadOrders(): void {
    this.loading.set(true);
    const vals = this.filterForm.value;
    this.orderSvc.adminList({
      statut: vals.statut || undefined,
      statut_paiement: vals.statut_paiement || undefined,
      date_from: vals.date_from || undefined,
      date_to: vals.date_to || undefined
    }).subscribe({
      next: (res) => { this.orders.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement des commandes.'); this.loading.set(false); }
    });
  }

  openStatusDialog(order: Order): void {
    const ref = this.dialog.open(StatusDialogComponent, { width: '380px', data: { order } });
    ref.afterClosed().subscribe(newStatus => {
      if (newStatus) {
        this.orderSvc.updateStatus(order.id, newStatus).subscribe({
          next: () => { this.toastSvc.success('Statut mis à jour.'); this.loadOrders(); },
          error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur de mise à jour.')
        });
      }
    });
  }

  openPaymentDialog(order: Order): void {
    const ref = this.dialog.open(PaymentDialogComponent, { width: '420px', data: { order } });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.orderSvc.confirmPayment(order.id, result).subscribe({
          next: () => { this.toastSvc.success('Paiement confirmé.'); this.loadOrders(); },
          error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur de confirmation.')
        });
      }
    });
  }

  getStatusBadgeClass(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmee: 'bg-blue-50 text-blue-700 border-blue-200',
      preparee: 'bg-purple-50 text-purple-700 border-purple-200',
      livree: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      annulee: 'bg-red-50 text-red-700 border-red-200'
    };
    return map[s] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'En Attente', confirmee: 'Confirmée', preparee: 'Préparée',
      livree: 'Livrée', annulee: 'Annulée'
    };
    return map[s] ?? s;
  }

  getPaymentBadgeClass(s: string): string {
    return s === 'paye' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200';
  }

  cancelOrder(order: Order): void {
    if (!confirm(`Annuler la commande #${order.id} et remettre les produits en stock ? Cette action est irréversible.`)) {
      return;
    }
    this.orderSvc.adminCancel(order.id).subscribe({
      next: () => {
        this.toastSvc.success('Commande annulée avec succès.');
        this.loadOrders();
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'annulation de la commande.');
      }
    });
  }
}
