import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Order } from '../../../models/order.interface';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.css']
})
export class PaymentDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  readonly data = inject<{ order: Order }>(MAT_DIALOG_DATA);

  paymentForm!: FormGroup;

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      modalite_paiement: [this.data.order.modalite_paiement || 'especes', [Validators.required]],
      reference: ['', [Validators.pattern(/^TXN-\d{4}-\d{3,8}$/i)]]
    });

    // Dynamically add/remove required validator on `reference` based on payment method
    this.paymentForm.get('modalite_paiement')!.valueChanges.subscribe(method => {
      const refCtrl = this.paymentForm.get('reference')!;
      if (method === 'carte') {
        refCtrl.setValidators([Validators.required, Validators.pattern(/^TXN-\d{4}-\d{3,8}$/i)]);
      } else {
        refCtrl.clearValidators();
      }
      refCtrl.updateValueAndValidity();
    });

    // Trigger initial state
    if (this.data.order.modalite_paiement === 'carte') {
      this.paymentForm.get('reference')!.setValidators([Validators.required, Validators.pattern(/^TXN-\d{4}-\d{3,8}$/i)]);
      this.paymentForm.get('reference')!.updateValueAndValidity();
    } else {
      this.paymentForm.get('reference')!.clearValidators();
      this.paymentForm.get('reference')!.updateValueAndValidity();
    }
  }

  get isCarte(): boolean {
    return this.paymentForm.get('modalite_paiement')?.value === 'carte';
  }

  generateRef(): void {
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-5);
    this.paymentForm.get('reference')!.setValue(`TXN-${year}-${seq}`);
  }

  save(): void {
    if (this.paymentForm.invalid) return;
    this.dialogRef.close(this.paymentForm.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
