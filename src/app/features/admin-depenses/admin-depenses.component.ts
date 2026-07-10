import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { DepenseService } from '../../services/depense.service';
import { TypeDepenseService } from '../../services/type-depense.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { Depense } from '../../models/depense.model';
import { TypeDepense } from '../../models/type-depense.model';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-depenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-depenses.component.html',
  styleUrls: ['./admin-depenses.component.css']
})
export class AdminDepensesComponent implements OnInit {
  private readonly depenseSvc = inject(DepenseService);
  private readonly typeDepenseSvc = inject(TypeDepenseService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  depenses = signal<Depense[]>([]);
  types = signal<TypeDepense[]>([]);
  complexes = signal<Complexe[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Depense | null>(null);
  submitting = signal(false);
  totalMois = signal(0);
  todayDate = new Date().toISOString().split('T')[0];

  depenseForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.depenseForm = this.fb.group({
      date_depense: ['', Validators.required],
      montant_dep: ['', [Validators.required, Validators.min(0)]],
      commentaire_dep: [''],
      type_depense_id: ['', Validators.required],
      complexe_id: ['', Validators.required],
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.depenseSvc.list().subscribe({
      next: (res) => { this.depenses.set(res.data); this.loading.set(false); this.calcTotal(); },
      error: () => { this.toastSvc.error('Erreur chargement dépenses.'); this.loading.set(false); }
    });
    this.typeDepenseSvc.list(true).subscribe({ next: (res) => this.types.set(res.data) });
    this.loadComplexes();
  }

  loadComplexes(): void {
    this.complexeSvc.getAll().subscribe({ next: (res) => this.complexes.set(res) });
  }

  calcTotal(): void {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const total = this.depenses()
      .filter(d => d.date_depense.startsWith(ym))
      .reduce((s, d) => s + Number(d.montant_dep || 0), 0);
    this.totalMois.set(Math.round(total * 1000) / 1000);
  }

  openCreateForm(): void {
    this.editing.set(null);
    this.depenseForm.reset();
    this.showForm.set(true);
  }

  openEditForm(d: Depense): void {
    this.editing.set(d);
    this.depenseForm.patchValue({
      date_depense: d.date_depense,
      montant_dep: d.montant_dep,
      commentaire_dep: d.commentaire_dep || '',
      type_depense_id: d.type_depense_id,
      complexe_id: d.complexe_id,
    });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editing.set(null); }

  save(): void {
    if (this.depenseForm.invalid) return;
    this.submitting.set(true);
    const vals = this.depenseForm.value;
    const req = this.editing() ? this.depenseSvc.update(this.editing()!.id, vals) : this.depenseSvc.create(vals);
    req.subscribe({
      next: () => { this.toastSvc.success(this.editing() ? 'Dépense modifiée.' : 'Dépense créée.'); this.submitting.set(false); this.closeForm(); this.loadData(); },
      error: (err) => { this.toastSvc.error(err?.error?.message || 'Erreur.'); this.submitting.set(false); }
    });
  }

  delete(d: Depense): void {
    if (!confirm(`Supprimer la dépense du ${d.date_depense} (${d.montant_dep} DT) ?`)) return;
    this.depenseSvc.delete(d.id).subscribe({
      next: () => { this.toastSvc.success('Dépense supprimée.'); this.loadData(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
