import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../models/product.interface';

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './stock-dialog.component.html',
  styleUrls: ['./stock-dialog.component.css']
})
export class StockDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<StockDialogComponent>);
  readonly data = inject<{ product: Product }>(MAT_DIALOG_DATA);

  stockForm!: FormGroup;

  ngOnInit(): void {
    const currentQty = this.data.product.stock?.quantite_disponible ?? 0;
    const minQty = this.data.product.stock?.quantite_minimale ?? 5;

    this.stockForm = this.fb.group({
      quantite_disponible: [currentQty, [Validators.required, Validators.min(0)]],
      quantite_minimale: [minQty, [Validators.required, Validators.min(1)]]
    });
  }

  save(): void {
    if (this.stockForm.invalid) return;
    this.dialogRef.close(this.stockForm.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
