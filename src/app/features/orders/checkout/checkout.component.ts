import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
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

  checkoutForm = this.fb.group({
    modalite_paiement: ['carte', [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    if (this.cartItems().length === 0) {
      this.toastSvc.warning('Votre panier est vide.');
      this.router.navigate(['/shop']);
    }
  }

  submitOrder(): void {
    if (this.checkoutForm.invalid || this.cartItems().length === 0) return;

    this.submitting.set(true);

    // Get complexe_id from the first item
    const firstItem = this.cartItems()[0];
    // In our Product interface, complexe is an object which may contain id. Let's handle it safely.
    const complexeId = firstItem.product.complexe?.id;

    if (!complexeId) {
      this.toastSvc.error('Impossible de déterminer le complexe du produit.');
      this.submitting.set(false);
      return;
    }

    const payload = {
      complexe_id: complexeId,
      modalite_paiement: this.checkoutForm.value.modalite_paiement as 'carte' | 'especes',
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
}
