import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActiviteService } from '../../services/activite.service';
import { ToastService } from '../../services/toast.service';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { ReservationActivite } from '../../models/activite.model';

@Component({
  selector: 'app-mes-activites',
  standalone: true,
  imports: [CommonModule, RouterModule, PaymentModalComponent],
  templateUrl: './mes-activites.component.html',
})
export class MesActivitesComponent implements OnInit {
  private readonly activiteSvc = inject(ActiviteService);
  private readonly toastSvc    = inject(ToastService);

  reservations    = signal<ReservationActivite[]>([]);
  loading         = signal(true);
  errorMessage    = signal('');
  successMessage  = signal('');
  activeTab       = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');
  filteredReservations = computed(() => {
    const now = Date.now();
    return this.reservations().filter((res) => {
      const seanceAt = new Date(res.date_seance + 'T' + (res.activite?.heure_debut || '00:00')).getTime();
      if (this.activeTab() === 'upcoming') {
        return (res.statut === 'reservee' || res.statut === 'confirmee') && seanceAt >= now;
      }
      if (this.activeTab() === 'past') {
        // Only show past sessions (seanceAt < now), regardless of statut
        return seanceAt < now && (res.statut === 'confirmee' || res.statut === 'reservee');
      }
      return res.statut === 'annulee';
    });
  });

  // Payment modal state
  showPaymentModal   = signal(false);
  payingReservation  = signal<ReservationActivite | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.activiteSvc.getMesActivites().subscribe({
      next: (data) => { this.reservations.set(data); this.loading.set(false); },
      error: ()     => { this.errorMessage.set('Impossible de charger vos activités.'); this.loading.set(false); },
    });
  }

  statutBadge(statut: string): { class: string; label: string } {
    switch (statut) {
      case 'reservee':  return { class: 'bg-yellow-100 text-yellow-700',  label: 'Réservée' };
      case 'confirmee': return { class: 'bg-green-100 text-green-700',   label: 'Confirmée' };
      case 'annulee':   return { class: 'bg-red-100 text-red-600',       label: 'Annulée' };
      default:          return { class: 'bg-gray-100 text-gray-600',     label: statut };
    }
  }

  paiementBadge(statut: string): { class: string; label: string } {
    return statut === 'paye'
      ? { class: 'bg-green-100 text-green-700',  label: 'Payé' }
      : { class: 'bg-orange-100 text-orange-700', label: 'Non Payé' };
  }

  canPay(res: ReservationActivite): boolean {
    return res.statut_paiement === 'non_paye'
      && res.modalite_paiement === 'carte'
      && (res.statut === 'reservee' || res.statut === 'confirmee');
  }

  canCancel(res: ReservationActivite): boolean {
    if (res.statut !== 'reservee') return false;
    if (!res.activite) return false;
    const seanceAt = new Date(res.date_seance + 'T' + res.activite.heure_debut);
    const diffMs   = seanceAt.getTime() - Date.now();
    return diffMs > 2 * 60 * 60 * 1000; // more than 2 hours away
  }

  cancel(res: ReservationActivite): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.activiteSvc.cancelReservation(res.id).subscribe({
      next: () => {
        this.toastSvc.success('Réservation annulée.');
        this.successMessage.set('Réservation annulée.');
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Impossible d\'annuler.';
        this.toastSvc.error(msg);
        this.errorMessage.set(msg);
      },
    });
  }

  delete(res: ReservationActivite): void {
    if (!confirm('Supprimer cette réservation annulée ?')) return;
    this.activiteSvc.deleteReservation(res.id).subscribe({
      next: () => {
        this.toastSvc.success('Réservation supprimée.');
        this.successMessage.set('Réservation supprimée.');
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Impossible de supprimer.';
        this.toastSvc.error(msg);
        this.errorMessage.set(msg);
      },
    });
  }

  /** Open the payment modal to enter card details */
  pay(res: ReservationActivite): void {
    this.payingReservation.set(res);
    this.showPaymentModal.set(true);
  }

  /** Called when the payment modal completes successfully */
  onPaymentModalPaid(token: string): void {
    const res = this.payingReservation();
    if (!res) return;

    this.activiteSvc.payReservation(res.id).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.payingReservation.set(null);
        this.toastSvc.success('Paiement effectué avec succès !');
        this.successMessage.set('Paiement effectué avec succès !');
        this.load();
      },
      error: (err) => {
        this.showPaymentModal.set(false);
        this.payingReservation.set(null);
        const msg = err?.error?.message || 'Erreur lors du paiement.';
        this.toastSvc.error(msg);
        this.errorMessage.set(msg);
      },
    });
  }

  /** Called when the payment modal is closed without paying */
  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.payingReservation.set(null);
    this.toastSvc.warning('Paiement non effectué. Vous pouvez payer depuis Mes Activités.');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = Number.parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }
}
