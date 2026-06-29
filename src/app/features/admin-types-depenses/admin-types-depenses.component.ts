import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TypeDepenseService } from '../../services/type-depense.service';
import { ToastService } from '../../services/toast.service';
import { TypeDepense } from '../../models/type-depense.model';

@Component({
  selector: 'app-admin-types-depenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-types-depenses.component.html',
  styleUrls: ['./admin-types-depenses.component.css']
})
export class AdminTypesDepensesComponent implements OnInit {
  private readonly typeDepenseSvc = inject(TypeDepenseService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  types = signal<TypeDepense[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<TypeDepense | null>(null);
  submitting = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.form = this.fb.group({
      designation_ty_dep: ['', [Validators.required, Validators.minLength(2)]],
      active: [true],
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.typeDepenseSvc.list().subscribe({
      next: (res) => { this.types.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ active: true });
    this.showForm.set(true);
  }

  openEdit(t: TypeDepense): void {
    this.editing.set(t);
    this.form.patchValue({ designation_ty_dep: t.designation_ty_dep, active: t.active });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editing.set(null); }

  save(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const vals = this.form.value;
    const req = this.editing() ? this.typeDepenseSvc.update(this.editing()!.id, vals) : this.typeDepenseSvc.create(vals);
    req.subscribe({
      next: () => { this.toastSvc.success(this.editing() ? 'Modifié.' : 'Créé.'); this.submitting.set(false); this.closeForm(); this.loadData(); },
      error: () => { this.toastSvc.error('Erreur.'); this.submitting.set(false); }
    });
  }

  remove(t: TypeDepense): void {
    if (!confirm(`Supprimer "${t.designation_ty_dep}" ?`)) return;
    this.typeDepenseSvc.delete(t.id).subscribe({
      next: () => { this.toastSvc.success('Supprimé.'); this.loadData(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
