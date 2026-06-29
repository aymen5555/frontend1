import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ComplexeService } from '../../services/complexe.service';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Supplier } from '../../models/supplier.interface';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-suppliers.component.html',
  styleUrls: ['./admin-suppliers.component.css']
})
export class AdminSuppliersComponent implements OnInit {
  private readonly supplierSvc = inject(SupplierService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly categorySvc = inject(CategoryService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  suppliers = signal<Supplier[]>([]);
  complexes = signal<Complexe[]>([]);
  categoriesFournisseur = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Supplier | null>(null);
  submitting = signal(false);

  supplierForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.supplierForm = this.fb.group({
      complexe_id: ['', [Validators.required]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      contact: [''],
      telephone: ['', [Validators.pattern(/^\+216\d{8}$/)]],
      email: ['', [Validators.email]],
      adresse: [''],
      categorie_fournisseur_id: [null as number | null]
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.supplierSvc.list().subscribe({
      next: (res) => { this.suppliers.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement des fournisseurs.'); this.loading.set(false); }
    });

    this.categorySvc.adminList('fournisseur').subscribe({
      next: (res) => { if (res?.data) this.categoriesFournisseur.set(res.data); },
      error: () => {}
    });

    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.complexes.set([(user as any).complexe]);
      this.supplierForm.patchValue({ complexe_id: (user as any).complexe.id });
    } else {
      this.complexeSvc.list().subscribe({ next: (res) => this.complexes.set(res) });
    }
  }

  openCreateForm(): void {
    this.editing.set(null);
    this.supplierForm.reset({ categorie_fournisseur_id: null });
    // Re-set complexe for gérant
    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.supplierForm.patchValue({ complexe_id: (user as any).complexe.id });
    }
    this.showForm.set(true);
  }

  openEditForm(supplier: Supplier): void {
    this.editing.set(supplier);
    this.supplierForm.patchValue({
      complexe_id: supplier.complexe_id,
      nom: supplier.nom,
      contact: supplier.contact || '',
      telephone: supplier.telephone || '',
      email: supplier.email || '',
      adresse: supplier.adresse || '',
      categorie_fournisseur_id: supplier.categorie_fournisseur_id ?? null
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
    this.supplierForm.reset();
  }

  save(): void {
    if (this.supplierForm.invalid) return;
    this.submitting.set(true);
    const vals = this.supplierForm.value;

    const req = this.editing()
      ? this.supplierSvc.update(this.editing()!.id, vals)
      : this.supplierSvc.create(vals);

    req.subscribe({
      next: () => {
        this.toastSvc.success(this.editing() ? 'Fournisseur mis à jour.' : 'Fournisseur créé.');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement.');
        this.submitting.set(false);
      }
    });
  }

  toggleStatus(supplier: Supplier): void {
    const nextState = !supplier.actif;
    const actionText = nextState ? 'Activer' : 'Désactiver';
    if (!confirm(`${actionText} le fournisseur "${supplier.nom}" ?`)) return;

    if (!nextState) {
      this.supplierSvc.deactivate(supplier.id).subscribe({
        next: () => { this.toastSvc.success('Fournisseur désactivé.'); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
      });
    } else {
      this.supplierSvc.update(supplier.id, { actif: true }).subscribe({
        next: () => { this.toastSvc.success('Fournisseur activé.'); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
      });
    }
  }
}
