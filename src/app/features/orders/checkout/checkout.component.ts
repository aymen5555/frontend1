import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { PaymentModalComponent } from '../../../components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PaymentModalComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private readonly cartSvc = inject(CartService);
  private readonly orderSvc = inject(OrderService);
  private readonly toastSvc = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  cartItems = this.cartSvc.items;
  cartTotal = this.cartSvc.total;
  submitting = signal(false);
  showPaymentModal = signal(false);
  readonly stripeCurrency: 'tnd' = 'tnd';
  complexeId?: number | null = null;

  checkoutForm = this.fb.group({
    modalite_paiement: ['carte', [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    if (this.cartItems().length === 0) {
      this.toastSvc.warning('Votre panier est vide.');
      this.router.navigate(['/shop']);
      return;
    }

    // Validate all items belong to the same complexe
    const complexeIds = new Set<number | undefined>();
    this.cartItems().forEach(item => complexeIds.add(item.product.complexe?.id));
    complexeIds.delete(undefined);

    if (complexeIds.size === 0) {
      this.toastSvc.error('Impossible de passer commande : certains produits n\'ont pas de complexe associé.');
      this.router.navigate(['/cart']);
      return;
    }

    if (complexeIds.size > 1) {
      this.toastSvc.error('Votre panier contient des produits de plusieurs complexes. Veuillez passer des commandes séparées par complexe.');
      this.router.navigate(['/cart']);
      return;
    }

    // Precompute complexeId for the payment modal
    const firstItem = this.cartItems()[0];
    this.complexeId = firstItem.product.complexe?.id;
  }

  submitOrder(): void {
    if (this.checkoutForm.invalid || this.cartItems().length === 0) return;

    // For card payments, show the payment modal first to collect credentials
    if (this.checkoutForm.value.modalite_paiement === 'carte') {
      this.showPaymentModal.set(true);
      return;
    }

    this.placeOrder();
  }

  /** Called when card credentials are confirmed in the payment modal */
  onCardConfirmed(paymentId?: string): void {
    this.showPaymentModal.set(false);
    this.placeOrder(true, paymentId);
  }

  /** Called when the payment modal is dismissed — do nothing, user stays on checkout */
  onCardCancelled(): void {
    this.showPaymentModal.set(false);
  }

  private placeOrder(paymentConfirmed = false, paymentIntentId?: string): void {
    this.submitting.set(true);

    // Get complexe_id from the first item (all items share the same complexe — validated in ngOnInit)
    const firstItem = this.cartItems()[0];
    const complexeId = firstItem.product.complexe?.id;

    if (!complexeId) {
      this.toastSvc.error('Impossible de déterminer le complexe du produit.');
      this.submitting.set(false);
      return;
    }

    const payload = {
      complexe_id: complexeId,
      modalite_paiement: this.checkoutForm.value.modalite_paiement as 'carte' | 'especes',
      payment_confirmed: paymentConfirmed && this.checkoutForm.value.modalite_paiement === 'carte',
      stripe_payment_intent_id: paymentIntentId || undefined,
      notes: this.checkoutForm.value.notes || undefined,
      items: this.cartItems().map(item => ({
        produit_id: item.product.id,
        quantite: item.quantity
      }))
    };

    this.orderSvc.create(payload).subscribe({
      next: () => {
        this.toastSvc.success('Commande passée avec succès !');
        this.cartSvc.clear();
        this.submitting.set(false);
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || 'Erreur lors de la validation de la commande.';
        this.toastSvc.error(errorMsg);
        this.submitting.set(false);
      }
    });
  }

  getAmountCents(): number {
    const tndAmount = this.cartTotal();
    return Math.round(tndAmount * 1000);
  }
}
