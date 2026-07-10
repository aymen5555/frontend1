import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../services/toast.service';
import { AbonnementAdherent } from '../../models/abonnement-adherent.model';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-mes-abonnements',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaymentModalComponent],
  templateUrl:'./mes-abonnements.component.html',
})
export class MesAbonnementsComponent implements OnInit {
  private readonly abonnementSvc = inject(AbonnementService);
  private readonly toastSvc      = inject(ToastService);
  private readonly router        = inject(Router);

  abonnements   = signal<AbonnementAdherent[]>([]);
  loading       = signal(true);
  errorMessage  = signal('');
  successMessage = signal('');
  activeTab     = signal<'actif' | 'expire' | 'annule'>('actif');
  filteredAbonnements = computed(() => {
    const tab = this.activeTab();
    return this.abonnements().filter((ab) => {
      if (tab === 'actif') return ab.statut === 'actif';
      if (tab === 'expire') return ab.statut === 'expire';
      return ab.statut === 'annule';
    });
  });
  referenceErrors = signal<Record<number, string>>({});
  payments      = signal<Record<number, AbonnementAdherent['reglements'] | undefined>>({});
  loadingPayments = signal<Record<number, boolean>>({});
  detailsVisible = signal<Record<number, boolean>>({});
  payingAbonnement = signal<AbonnementAdherent | null>(null);
  showPaymentModal = signal(false);

  ngOnInit(): void {
    this.load();
  }

  confirmPayment(ab: AbonnementAdherent, reference: string): void {
    if (!reference) {
      this.referenceErrors.update(err => ({ ...err, [ab.id]: 'Référence requise.' }));
      return;
    }
    this.referenceErrors.update(err => ({ ...err, [ab.id]: '' }));
    this.abonnementSvc.payAbonnement(ab.id, { modalite_paiement: 'especes', reference }).subscribe({
      next: () => {
        this.load();
        this.toastSvc.success('Paiement confirmé.');
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Impossible de confirmer le paiement.'),
    });
  }

  payWithCard(ab: AbonnementAdherent): void {
    this.payingAbonnement.set(ab);
    this.showPaymentModal.set(true);
  }

  getAbonnementAmountCents(): number | null {
    const ab = this.payingAbonnement();
    if (!ab) return null;
    return Math.round(ab.reste_a_payer * 1000);
  }

  onPaymentModalPaid(token: string): void {
    const ab = this.payingAbonnement();
    if (!ab) return;
    this.abonnementSvc.payAbonnement(ab.id, { modalite_paiement: 'carte', reference: token }).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.payingAbonnement.set(null);
        this.load();
        this.toastSvc.success('Paiement effectué.');
      },
      error: (err) => {
        this.showPaymentModal.set(false);
        this.payingAbonnement.set(null);
        this.toastSvc.error(err?.error?.message || 'Impossible de payer.');
      },
    });
  }

  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.payingAbonnement.set(null);
    this.toastSvc.warning('Paiement annulé.');
  }

  cancelSubscription(ab: AbonnementAdherent): void {
    if (!confirm('Voulez-vous annuler cet abonnement ?')) return;
    this.abonnementSvc.cancel(ab.id).subscribe({
      next: () => {
        this.load();
        this.toastSvc.success('Abonnement annulé.');
      },
      error: (err) => this.toastSvc.error(err?.error?.message || "Impossible d'annuler l'abonnement."),
    });
  }

  requestDelete(ab: AbonnementAdherent): void {
    if (!confirm('Voulez-vous supprimer définitivement cet abonnement de votre compte ?')) {
      return;
    }
    this.abonnementSvc.deleteAbonnement(ab.id).subscribe({
      next: () => {
        this.load();
        this.toastSvc.success('Abonnement supprimé.');
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Impossible de supprimer cet abonnement.'),
    });
  }

  togglePayments(ab: AbonnementAdherent): void {
    const current = this.payments()[ab.id];
    if (current) {
      this.payments.update(p => { const copy = { ...p }; delete copy[ab.id]; return copy; });
      return;
    }

    this.loadingPayments.update(l => ({ ...l, [ab.id]: true }));
    this.abonnementSvc.getAbonnementDetail(ab.id).subscribe({
      next: (detail) => {
        this.payments.update(p => ({ ...p, [ab.id]: detail.reglements || [] }));
        this.loadingPayments.update(l => ({ ...l, [ab.id]: false }));
      },
      error: () => {
        this.toastSvc.error('Impossible de charger l\'historique des paiements.');
        this.loadingPayments.update(l => ({ ...l, [ab.id]: false }));
      }
    });
  }

  toggleDetails(ab: AbonnementAdherent): void {
    const visible = !!this.detailsVisible()[ab.id];
    this.detailsVisible.update(d => ({ ...d, [ab.id]: !visible }));
  }

  load(): void {
    this.loading.set(true);
    this.abonnementSvc.getMesAbonnements().subscribe({
      next: (data) => {
        this.abonnements.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger vos abonnements.');
        this.loading.set(false);
      }
    });
  }

  statutBadge(statut: string): { class: string; label: string } {
    switch (statut) {
      case 'actif':   return { class: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Actif' };
      case 'expire':  return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Expiré' };
      case 'annule':  return { class: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' };
      default:        return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: statut };
    }
  }

  paiementBadge(paye: boolean, reste: number): { class: string; label: string } {
    if (paye) {
      return { class: 'bg-green-100 text-green-800', label: 'Payé' };
    }
    return { class: 'bg-orange-100 text-orange-800', label: `Reste à payer: ${reste} DT` };
  }

  renew(complexeId: number): void {
    this.router.navigate(['/complexes', complexeId]);
  }

  getSubscriptionAmountCents(ab: AbonnementAdherent | null): number | null {
    if (!ab) {
      return null;
    }
    const amountTnd = ab.reste_a_payer ?? ab.montant_apres_remise;
    return Math.round(amountTnd * 1000);
  }

  private parseDate(dateStr: string | null | undefined): Date {
    if (!dateStr) return new Date(NaN);
    return dateStr.length > 10 ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  }

  formatDate(dateStr: string | null | undefined): string {
    const d = this.parseDate(dateStr);

    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}