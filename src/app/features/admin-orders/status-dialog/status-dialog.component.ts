import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Order } from '../../../models/order.interface';

@Component({
  selector: 'app-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './status-dialog.component.html',
  styleUrls: ['./status-dialog.component.css']
})
export class StatusDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<StatusDialogComponent>);
  readonly data = inject<{ order: Order }>(MAT_DIALOG_DATA);

  statusForm!: FormGroup;

  statuses = [
    { value: 'en_attente', label: 'En Attente' },
    { value: 'confirmee', label: 'Confirmée' },
    { value: 'preparee', label: 'Préparée' },
    { value: 'livree', label: 'Livrée' },
    { value: 'annulee', label: 'Annulée' }
  ];

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      statut: [this.data.order.statut, [Validators.required]]
    });
  }

  save(): void {
    if (this.statusForm.invalid) return;
    this.dialogRef.close(this.statusForm.value.statut);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
