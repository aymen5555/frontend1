import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentModalComponent],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnInit {
  private readonly reservationSvc = inject(ReservationService);

  activeTab = signal<'A_VENIR' | 'PASSEES' | 'ANNULEES'>('A_VENIR');
  reservations = signal<Reservation[]>([]);
  loading = signal(true);
  // Payment modal state and user messages
  showPaymentModal = signal(false);
  paymentReservationId = signal<number | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  filteredReservations = computed(() => {
    const list = this.reservations();
    const now = new Date();
    switch (this.activeTab()) {
      case 'A_VENIR':
        return list.filter(r => 
          (r.status === 'confirmed' || r.status === 'pending') && new Date(r.start_at) >= now
        );
      case 'PASSEES':
        return list.filter(r => 
          (r.status === 'expired' || r.status === 'played') && new Date(r.start_at) < now
        );
      case 'ANNULEES':
        return list.filter(r => r.status === 'cancelled');
      default:
        return [];
    }
  });

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading.set(true);
    this.reservationSvc.getMine().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cancelReservation(id: number): void {
    const reservation = this.reservations().find(r => r.id === id);
    if (!reservation) return;
    
    const isPaid = reservation.statut_paiement === 'paye';
    const montant = reservation.montant_paye ?? 0;
    const msg = isPaid 
      ? `Votre réservation sera annulée et un remboursement de ${montant} DT sera initié. Confirmer ?`
      : 'Voulez-vous vraiment annuler cette réservation ?';
    
    if (!confirm(msg)) return;
    this.reservationSvc.cancel(id).subscribe({
      next: () => this.loadReservations(),
      error: (err) => this.errorMessage.set(err.error?.message || err.message || 'Erreur lors de l\'annulation')
    });
  }

  deleteReservation(id: number): void {
    if (!confirm('Supprimer définitivement cette réservation ?')) return;
    this.reservationSvc.delete(id).subscribe({
      next: () => {
        this.successMessage.set('Réservation supprimée.');
        this.loadReservations();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.message || 'Impossible de supprimer la réservation');
      }
    });
  }

  payReservation(id: number): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.paymentReservationId.set(id);
    this.showPaymentModal.set(true);
  }

  onPaymentModalPaid(token: string): void {
    const id = this.paymentReservationId();
    if (!id) return;
    this.reservationSvc.pay(id, 'carte', token).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.successMessage.set('Paiement simulé réussi.');
        this.loadReservations();
      },
      error: (err) => {
        this.showPaymentModal.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Erreur lors du paiement');
      }
    });
  }

  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.errorMessage.set('Paiement annulé par l\'utilisateur.');
  }

  getStatusBadge(res: Reservation): { label: string, class: string, borderClass: string } {
    if (res.status === 'cancelled') {
      return { label: 'Annulé', class: 'bg-red-100 text-red-700', borderClass: 'border-red-400' };
    }
    if (res.status === 'expired') {
      return { label: 'Expiré', class: 'bg-gray-100 text-gray-600', borderClass: 'border-gray-300' };
    }
    if (res.status === 'played') {
      return { label: 'Joué', class: 'bg-blue-100 text-blue-700', borderClass: 'border-blue-400' };
    }
    if (res.status === 'pending') {
      return { label: 'En attente', class: 'bg-yellow-100 text-yellow-700', borderClass: 'border-yellow-400' };
    }
    if (res.status === 'confirmed') {
      return { label: 'Confirmé', class: 'bg-green-100 text-green-700', borderClass: 'border-green-400' };
    }
    return { label: 'Inconnu', class: 'bg-gray-100 text-gray-600', borderClass: 'border-gray-300' };
  }

  getPaymentStatusBadge(res: Reservation): { label: string, class: string } {
    if (res.statut_paiement === 'paye') {
      return { label: 'Payé', class: 'bg-green-100 text-green-700' };
    }
    if (res.statut_paiement === 'rembourse') {
      return { label: 'Remboursé', class: 'bg-blue-100 text-blue-700' };
    }
    return { label: 'Non payé', class: 'bg-orange-100 text-orange-700' };
  }

  canPay(res: Reservation): boolean {
    return res.status === 'pending' && res.statut_paiement === 'non_paye';
  }

  canCancel(res: Reservation): boolean {
    if (res.status !== 'pending' && res.status !== 'confirmed') return false;
    const startAt = new Date(res.start_at);
    const now = new Date();
    const diffHours = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 2;
  }
}