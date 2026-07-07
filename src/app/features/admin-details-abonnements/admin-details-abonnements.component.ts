import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DetailAbonnementService } from '../../services/detail-abonnement.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Complexe } from '../../models/complexe.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-details-abonnements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-details-abonnements.component.html',
  styleUrls: ['./admin-details-abonnements.component.css']
})
export class AdminDetailsAbonnementsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  complexes = signal<Complexe[]>([]);
  typesAbonnement: any[] = [];
  selectedComplexeId = signal<number | null>(null);
  selectedTypeId = signal<number | null>(null);
  details = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);

  days = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadComplexes();
  }

  buildForm(): void {
    this.form = this.fb.group({
      type_abonnement_adherent_id: ['', Validators.required],
      jour_seance: ['', Validators.required],
      heure_debut_de_abo: ['', Validators.required],
      heure_fin_de_abo: ['', Validators.required],
    });
  }

  loadComplexes(): void {
    const user = this.authSvc.currentUser();
    this.complexeSvc.getAll().subscribe({
      next: (res) => {
        this.complexes.set(res);
        if (res.length) {
          this.selectedComplexeId.set(res[0].id);
          this.loadTypes();
        } else {
          this.loading.set(false);
        }
      },
      error: () => { this.toastSvc.error('Erreur.'); this.loading.set(false); }
    });
  }

  onComplexeChange(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    const cid = this.selectedComplexeId();
    if (!cid) { this.typesAbonnement = []; return; }
    this.http.get<any>(`${environment.apiUrl}/admin/abonnements/types`).subscribe({
      next: (res) => {
        this.typesAbonnement = (res.data || []).filter((t: any) => t.complexe_id === cid);
        if (this.typesAbonnement.length) {
          this.selectedTypeId.set(this.typesAbonnement[0].id);
          this.loadDetails();
        }
      }
    });
  }

  onTypeChange(): void {
    this.loadDetails();
  }

  loadDetails(): void {
    const tid = this.selectedTypeId();
    if (!tid) { this.details.set([]); return; }
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/admin/details-abonnements/${tid}`).subscribe({
      next: (res) => { this.details.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement créneaux.'); this.loading.set(false); }
    });
  }

  openForm(): void {
    this.form.reset();
    this.selectedTypeId() && this.form.patchValue({ type_abonnement_adherent_id: this.selectedTypeId() });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const tid = this.selectedTypeId();
    if (!tid) return;
    this.http.post<any>(`${environment.apiUrl}/admin/details-abonnements/${tid}`, this.form.value).subscribe({
      next: () => { this.toastSvc.success('Créneau ajouté.'); this.submitting.set(false); this.closeForm(); this.loadDetails(); },
      error: () => { this.toastSvc.error('Erreur.'); this.submitting.set(false); }
    });
  }

  remove(detailId: number): void {
    if (!confirm('Supprimer ce créneau ?')) return;
    const tid = this.selectedTypeId();
    if (!tid) return;
    this.http.delete<any>(`${environment.apiUrl}/admin/details-abonnements/${tid}/${detailId}`).subscribe({
      next: () => { this.toastSvc.success('Supprimé.'); this.loadDetails(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
