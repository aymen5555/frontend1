import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

interface StripePaymentResult {
  error?: { message?: string };
  paymentIntent?: { id?: string; status?: string };
}

declare global {
  interface Window {
    Stripe?: any;
  }
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent implements OnInit, OnDestroy {
  @Input() reservationId?: number | null = null;
  @Input() shopItems?: { produit_id: number; quantite: number }[] | null = null;
  @Input() complexeId?: number | null = null;
  @Input() typeAbonnementId?: number | null = null;
  @Input() subscriptionDateDebut?: string | null = null;
  @Input() abonnementId?: number | null = null;
  @Input() paymentDeadlineMinutes?: number | null = null;
  @Input() amountCents: number | null = null;
  @Input() currency = 'eur';
  @Output() paid = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  private readonly orderSvc = inject(OrderService);
  private readonly reservationSvc = inject(ReservationService);
  private readonly toastSvc = inject(ToastService);
  private stripe: any;
  private elements: any;
  private card: any;
  private readonly stripeScriptId = 'stripe-js-script';
  submitting = false;
  loadingAmount = false;
  cardErrorMessage = '';
  isStripeReady = false;
  billingName = '';
  postalCode = '';
  private readonly tndToEurRate = 0.32; // temporary conversion rate (TND -> EUR)
  displayAmountText = '';
  displayCurrency = 'EUR';

  ngOnInit(): void {
    this.loadStripeScript();
    this.setDisplayAmountIfKnown();
    this.loadAmountIfNeeded();
  }

  ngOnDestroy(): void {
    this.card?.destroy?.();
  }

  private setDisplayAmountIfKnown(): void {
    if (!this.amountCents || this.amountCents <= 0) {
      return;
    }

    if (this.currency?.toLowerCase() === 'tnd') {
      // Do not display a TND amount preview when Stripe is charging in EUR.
      // Wait for server preview to compute the actual Stripe currency amount.
      return;
    }

    this.displayCurrency = (this.currency || 'eur').toUpperCase();
    this.displayAmountText = (this.amountCents / 100).toFixed(2);
  }

  submit(): void {
    // Do not trust client-side amount calculation. The server will compute the exact amount and return a client secret.
    const minCents = 50; // 0.50 EUR minimum for Stripe
    if (!this.amountCents || this.amountCents < minCents) {
      this.toastSvc.error(`Le montant (${(this.amountCents || 0)/100} EUR) doit être supérieur à 0.50 EUR pour le paiement Stripe.`);
      return;
    }

    if (!this.stripe || !this.card) {
      this.toastSvc.error('Stripe n’est pas encore prêt. Vérifiez la clé publique et votre connexion.');
      return;
    }

    if (this.loadingAmount) {
      this.toastSvc.error('Veuillez patienter pendant que le montant est chargé.');
      return;
    }

    this.submitting = true;
    this.cardErrorMessage = '';

    const createPayload: any = {};
    if (this.reservationId) createPayload.reservation_id = this.reservationId;
    else if (this.shopItems) {
      createPayload.items = this.shopItems;
      if (this.complexeId) createPayload.complexe_id = this.complexeId;
    } else if (this.typeAbonnementId) {
      createPayload.type_abonnement_id = this.typeAbonnementId;
      if (this.subscriptionDateDebut) createPayload.date_debut = this.subscriptionDateDebut;
    } else if (this.abonnementId) {
      createPayload.abonnement_id = this.abonnementId;
    }

    this.orderSvc.createPaymentIntent(createPayload).subscribe({
      next: (response) => {
        const clientSecret = response?.data?.clientSecret;
        const computed = response?.data?.computed;
        if (computed) {
          this.displayAmountText = (computed.amount / 100).toFixed(2);
          this.displayCurrency = (computed.currency || 'eur').toUpperCase();
        }

        if (!clientSecret) {
          this.cardErrorMessage = 'Le paiement Stripe n’a pas pu être initialisé.';
          this.toastSvc.error(this.cardErrorMessage);
          this.submitting = false;
          return;
        }

        this.stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.billingName || 'Client',
              address: {
                postal_code: this.postalCode || undefined,
              },
            },
          },
        }).then((result: StripePaymentResult) => {
          if (result.error) {
            this.cardErrorMessage = result.error.message || 'Le paiement a échoué.';
            this.toastSvc.error(this.cardErrorMessage);
            this.submitting = false;
            return;
          }

          if (result.paymentIntent?.status === 'succeeded') {
            this.toastSvc.success('Paiement Stripe réussi.');
            this.paid.emit(result.paymentIntent.id);
            this.submitting = false;
            return;
          }

          this.cardErrorMessage = 'Le paiement n’a pas été finalisé.';
          this.toastSvc.error(this.cardErrorMessage);
          this.submitting = false;
        }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Le paiement Stripe a échoué.';
          this.cardErrorMessage = message;
          this.toastSvc.error(this.cardErrorMessage);
          this.submitting = false;
        });
      },
      error: (err: unknown) => {
        const message = err && typeof err === 'object' && 'error' in err && err.error && typeof err.error === 'object' && 'message' in err.error && typeof err.error.message === 'string'
          ? err.error.message
          : 'Impossible de créer le paiement Stripe.';
        this.cardErrorMessage = message;
        this.toastSvc.error(this.cardErrorMessage);
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.closed.emit();
  }

  private loadStripeScript(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const publishableKey = environment.stripePublishableKey?.trim();
    if (!publishableKey) {
      this.cardErrorMessage = 'Ajoutez votre clé Stripe publique dans l’environnement frontend pour activer le paiement en ligne.';
      return;
    }

    if (window.Stripe) {
      this.initializeStripe(publishableKey);
      return;
    }

    if (document.getElementById(this.stripeScriptId)) {
      this.waitForStripeScript(publishableKey);
      return;
    }

    const script = document.createElement('script');
    script.id = this.stripeScriptId;
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => this.initializeStripe(publishableKey);
    script.onerror = () => {
      this.cardErrorMessage = 'Le script Stripe n’a pas pu être chargé.';
      this.toastSvc.error(this.cardErrorMessage);
    };
    document.head.appendChild(script);
  }

  private waitForStripeScript(publishableKey: string): void {
    const interval = window.setInterval(() => {
      if (window.Stripe) {
        window.clearInterval(interval);
        this.initializeStripe(publishableKey);
      }
    }, 100);
  }

  private loadAmountIfNeeded(): void {
    if (this.amountCents && this.amountCents > 0 && this.currency?.toLowerCase() !== 'tnd') {
      return;
    }

    if (!this.reservationId && !this.shopItems && !this.typeAbonnementId && !this.abonnementId) {
      return;
    }

    this.loadingAmount = true;
    // Ask server for authoritative preview (conversion + rounding)
    const previewPayload: any = {};
    if (this.reservationId) previewPayload.reservation_id = this.reservationId;
    else if (this.shopItems) {
      previewPayload.items = this.shopItems;
      if (this.complexeId) previewPayload.complexe_id = this.complexeId;
    } else if (this.typeAbonnementId) {
      previewPayload.type_abonnement_id = this.typeAbonnementId;
      if (this.subscriptionDateDebut) previewPayload.date_debut = this.subscriptionDateDebut;
    } else if (this.abonnementId) {
      previewPayload.abonnement_id = this.abonnementId;
    }

    this.orderSvc.previewPayment(previewPayload).subscribe({
      next: (res) => {
        const data = res?.data;
        if (!data) {
          this.cardErrorMessage = 'Impossible de déterminer le montant de la réservation.';
          this.loadingAmount = false;
          return;
        }

        this.amountCents = data.amount;
        this.displayCurrency = (data.currency || 'eur').toUpperCase();
        if (data.amount_display) {
          this.displayAmountText = data.amount_display;
        } else if (this.displayCurrency.toLowerCase() === 'tnd') {
          this.displayAmountText = (this.amountCents / 1000).toFixed(2);
        } else {
          this.displayAmountText = (this.amountCents / 100).toFixed(2);
        }
        this.loadingAmount = false;
      },
      error: () => {
        this.cardErrorMessage = 'Impossible de charger le montant de la réservation.';
        this.loadingAmount = false;
      }
    });
  }

  private initializeStripe(publishableKey: string): void {
    this.stripe = window.Stripe(publishableKey);
    this.elements = this.stripe.elements();
    this.card = this.elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '16px',
          '::placeholder': {
            color: '#94a3b8',
          },
        },
        invalid: {
          color: '#dc2626',
        },
      },
    });

    this.card.mount('#card-element');
    this.card.on('change', (event: any) => {
      this.cardErrorMessage = event.error?.message || '';
    });
    this.isStripeReady = true;
  }
}
