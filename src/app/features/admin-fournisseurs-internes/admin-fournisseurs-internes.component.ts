import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FournisseurInterneService } from '../../services/fournisseur-interne.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { FournisseurInterne } from '../../models/fournisseur-interne.model';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-fournisseurs-internes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-fournisseurs-internes.component.html',
  styleUrls: ['./admin-fournisseurs-internes.component.css']
})
export class AdminFournisseursInternesComponent implements OnInit {
  private readonly fournisseurSvc = inject(FournisseurInterneService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  fournisseurs = signal<FournisseurInterne[]>([]);
  complexes = signal<Complexe[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<FournisseurInterne | null>(null);
  submitting = signal(false);
  submittedAttempt = false;

  fournisseurForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.fournisseurForm = this.fb.group({
      complexe_id: ['', [Validators.required]],
      nom_f_int: ['', [Validators.required, Validators.minLength(2)]],
      raison_sociale_f_int: [''],
      contact_f_int: [''],
      tel_f_int: [''],
      email_f_int: ['', [Validators.email]],
      adresse_f_int: [''],
      matricule_fiscale_f_int: ['']
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.fournisseurSvc.list().subscribe({
      next: (res) => { this.fournisseurs.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement.'); this.loading.set(false); }
    });

    this.complexeSvc.list().subscribe({
      next: (res) => {
        this.complexes.set(res);
        if (res.length && this.authSvc.currentUser()?.role === 'GERANT') {
          this.fournisseurForm.patchValue({ complexe_id: res[0].id });
        }
      }
    });
  }

  openCreateForm(): void {
    this.editing.set(null);
    this.fournisseurForm.reset();
    const user = this.authSvc.currentUser();
    if (this.complexes().length && user?.role === 'GERANT') {
      this.fournisseurForm.patchValue({ complexe_id: this.complexes()[0].id });
    }
    this.showForm.set(true);
  }

  openEditForm(f: FournisseurInterne): void {
    this.editing.set(f);
    this.fournisseurForm.patchValue({
      complexe_id: f.complexe_id,
      nom_f_int: f.nom_f_int,
      raison_sociale_f_int: f.raison_sociale_f_int || '',
      contact_f_int: f.contact_f_int || '',
      tel_f_int: f.tel_f_int || '',
      email_f_int: f.email_f_int || '',
      adresse_f_int: f.adresse_f_int || '',
      matricule_fiscale_f_int: f.matricule_fiscale_f_int || ''
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
    this.fournisseurForm.reset();
  }

  save(): void {
    this.submittedAttempt = true;
    Object.values(this.fournisseurForm.controls).forEach(c => c.markAsTouched());
    if (this.fournisseurForm.invalid) return;
    this.submitting.set(true);
    let vals = this.fournisseurForm.value;

    // GERANTs should not send complexe_id; backend sets it automatically
    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT') {
      delete vals.complexe_id;
    }

    const req = this.editing()
      ? this.fournisseurSvc.update(this.editing()!.id, vals)
      : this.fournisseurSvc.create(vals);

    req.subscribe({
      next: () => {
        this.toastSvc.success(this.editing() ? 'Fournisseur interne mis à jour.' : 'Fournisseur interne créé.');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err) => {
        this.submitting.set(false);
        if (err?.status === 422 && err?.error?.errors) {
          const errors = err.error.errors;
          Object.keys(errors).forEach(key => {
            if (this.fournisseurForm.controls[key]) {
              this.fournisseurForm.controls[key].setErrors({ server: errors[key][0] });
            }
          });
          this.toastSvc.error('Erreur de validation — veuillez vérifier les champs.');
          return;
        }
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement.');
      }
    });
  }

  toggleActive(f: FournisseurInterne): void {
    this.fournisseurSvc.toggleActive(f.id).subscribe({
      next: (res) => {
        this.toastSvc.success(res.data.active ? 'Fournisseur réactivé.' : 'Fournisseur désactivé.');
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
    });
  }

  delete(f: FournisseurInterne): void {
    if (!confirm(`Supprimer le fournisseur interne "${f.nom_f_int}" ?`)) return;
    this.fournisseurSvc.destroy(f.id).subscribe({
      next: () => { this.toastSvc.success('Fournisseur supprimé.'); this.loadData(); },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
    });
  }
}
