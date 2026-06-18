import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../services/toast.service';
import { AbonnementAdherent } from '../../models/abonnement-adherent.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
})
export class SubscriptionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly abonnementSvc = inject(AbonnementService);
  private readonly toastSvc = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  abonnements = signal<AbonnementAdherent[]>([]);
  loading = signal(true);
  formLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  referenceErrors = signal<Record<number, string>>({});

  form: FormGroup = this.fb.group({
    type: ['MONTHLY', Validators.required],
    payment_method: ['especes', Validators.required],
    price: [49, [Validators.required, Validators.min(0)]],
  });

  get paymentMethod(): string {
    return this.form.get('payment_method')?.value;
  }

  get type(): string {
    return this.form.get('type')?.value;
  }

  readonly selectedPrice = computed(() => {
    const prices: Record<string, number> = { MONTHLY: 49, YEARLY: 499 };
    return prices[this.type] || 0;
  });

  ngOnInit(): void {
    this.form.get('type')?.valueChanges.subscribe((type: string) => {
      const prices: Record<string, number> = { MONTHLY: 49, YEARLY: 499 };
      this.form.get('price')?.setValue(prices[type] || 0);
    });

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/abonnements' } });
      return;
    }

    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.abonnementSvc.getMesAbonnements().subscribe({
      next: (subs) => {
        this.abonnements.set(subs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // For new system, redirect to browse-subscriptions page
    this.router.navigate(['/abonnements/parcourir']);
    this.formLoading.set(false);
  }

  confirmPayment(subscription: AbonnementAdherent, reference: string): void {
    if (!reference) {
      this.referenceErrors.update(errors => ({ ...errors, [subscription.id]: 'Référence requise.' }));
      return;
    }

    this.referenceErrors.update(errors => ({ ...errors, [subscription.id]: '' }));
    this.abonnementSvc.legacyConfirmPayment(subscription.id, reference).subscribe({
      next: () => {
        this.loadSubscriptions();
        this.successMessage.set('Paiement confirmé. Votre abonnement est maintenant actif.');
        this.toastSvc.success('Paiement confirmé.');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Impossible de confirmer le paiement.';
        this.errorMessage.set(msg);
        this.toastSvc.error(msg);
      },
    });
  }

  cancelSubscription(subscription: AbonnementAdherent): void {
    if (!confirm('Voulez-vous annuler cet abonnement ?')) return;
    this.abonnementSvc.legacyCancel(subscription.id).subscribe({
      next: () => {
        this.loadSubscriptions();
        this.successMessage.set('Abonnement annulé.');
        this.toastSvc.success('Abonnement annulé.');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Impossible d\'annuler l\'abonnement.';
        this.errorMessage.set(msg);
        this.toastSvc.error(msg);
      },
    });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  statutBadge(statut: string): { class: string; label: string } {
    switch (statut) {
      case 'actif':  return { class: 'bg-emerald-100 text-emerald-800', label: 'Actif' };
      case 'expire': return { class: 'bg-gray-100 text-gray-700', label: 'Expiré' };
      case 'annule': return { class: 'bg-red-100 text-red-800', label: 'Annulé' };
      default:       return { class: 'bg-gray-100 text-gray-700', label: statut };
    }
  }

  paiementBadge(paye: boolean, reste: number): { class: string; label: string } {
    if (paye) return { class: 'bg-green-100 text-green-800', label: 'Payé' };
    if (reste > 0) return { class: 'bg-orange-100 text-orange-800', label: `Reste: ${reste} DT` };
    return { class: 'bg-orange-100 text-orange-800', label: 'En attente' };
  }

  canPay(subscription: AbonnementAdherent): boolean {
    return !subscription.paye && subscription.reste_a_payer > 0 && subscription.modalite_paiement === 'carte';
  }

  canCancel(subscription: AbonnementAdherent): boolean {
    return subscription.statut === 'actif';
  }
}
