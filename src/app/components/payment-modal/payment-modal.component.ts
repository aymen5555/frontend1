import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent {
  @Input() reservationId?: number | null = null;
  @Input() paymentDeadlineMinutes?: number | null = null;
  @Output() paid = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  form = new FormBuilder().group({
    cardholder: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required]],
    expiry: ['', [Validators.required]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  formatCardNumber(): void {
    const control = this.form.get('cardNumber');
    if (!control) return;
    let v = (control.value || '').toString().replace(/\D/g, '').slice(0, 16);
    v = v.match(/.{1,4}/g)?.join(' ') || v;
    control.setValue(v, { emitEvent: false });
  }

  validateExpiry(): void {
    const control = this.form.get('expiry');
    if (!control) return;
    let v = (control.value || '').toString().replace(/[^0-9/]/g, '');
    if (v.length === 4 && !v.includes('/')) {
      v = v.slice(0,2) + '/' + v.slice(2);
    }
    control.setValue(v, { emitEvent: false });
  }

  submit(): void {
    // Force validation
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      alert('Veuillez remplir tous les champs de la carte');
      return;
    }

    // Strict card validation
    const cardholder = (this.form.get('cardholder')!.value || '').toString().trim();
    const cardNumber = (this.form.get('cardNumber')!.value || '').toString().replace(/\s/g, '');
    const expiry = (this.form.get('expiry')!.value || '').toString().trim();
    const cvv = (this.form.get('cvv')!.value || '').toString().trim();

    // Validate card number (16 digits)
    if (!/^\d{16}$/.test(cardNumber)) {
      alert('Numéro de carte invalide (16 chiffres requis)');
      return;
    }

    // Validate CVV (exactly 3 digits)
    if (!/^\d{3}$/.test(cvv)) {
      alert('Code de sécurité invalide (3 chiffres requis)');
      return;
    }

    // Validate expiry format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      alert('Date d\'expiration invalide (format MM/YY)');
      return;
    }

    // Validate cardholder name
    if (cardholder.length < 2) {
      alert('Nom du titulaire invalide');
      return;
    }

    // All validations passed - emit token
    const token = `SIM-${cardNumber.slice(-4)}-${Date.now()}`;
    this.paid.emit(token);
  }

  onCancel(): void {
    this.closed.emit();
  }
}
