import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EquipementService } from '../../services/equipement.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Equipement } from '../../models/equipement.model';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-equipements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-equipements.component.html',
  styleUrls: ['./admin-equipements.component.css']
})
export class AdminEquipementsComponent implements OnInit {
  private readonly equipementSvc = inject(EquipementService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  equipements = signal<Equipement[]>([]);
  complexes = signal<Complexe[]>([]);
  complexeEquipements = signal<Equipement[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Equipement | null>(null);
  submitting = signal(false);
  selectedComplexeId = signal<number | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.form = this.fb.group({
      nom_eq: ['', Validators.required],
      icone_eq: [''],
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.equipementSvc.list().subscribe({
      next: (res) => { this.equipements.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement.'); this.loading.set(false); }
    });
    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.complexes.set([(user as any).complexe]);
      this.selectedComplexeId.set((user as any).complexe.id);
      this.loadComplexeEquipements();
    } else {
      this.complexeSvc.getAll().subscribe({ next: (res) => { this.complexes.set(res); if (res.length) this.selectedComplexeId.set(res[0].id); } });
    }
  }

  onComplexeChange(): void {
    this.loadComplexeEquipements();
  }

  loadComplexeEquipements(): void {
    const cid = this.selectedComplexeId();
    if (!cid) { this.complexeEquipements.set([]); return; }
    this.equipementSvc.getComplexeEquipements(cid).subscribe({
      next: (res) => this.complexeEquipements.set(res.data),
      error: () => this.complexeEquipements.set([])
    });
  }

  isAttached(equipementId: number): boolean {
    return this.complexeEquipements().some(e => e.id === equipementId);
  }

  toggleAttach(eq: Equipement): void {
    const cid = this.selectedComplexeId();
    if (!cid) return;
    this.equipementSvc.toggleComplexe(eq.id, cid).subscribe({
      next: () => { this.loadComplexeEquipements(); this.toastSvc.success(this.isAttached(eq.id) ? 'Détaché.' : 'Attaché.'); },
      error: () => this.toastSvc.error('Erreur.')
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(eq: Equipement): void {
    this.editing.set(eq);
    this.form.patchValue({ nom_eq: eq.nom_eq, icone_eq: eq.icone_eq || '' });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editing.set(null); }

  save(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const vals = this.form.value;
    const req = this.editing() ? this.equipementSvc.update(this.editing()!.id, vals) : this.equipementSvc.create(vals);
    req.subscribe({
      next: () => { this.toastSvc.success(this.editing() ? 'Modifié.' : 'Créé.'); this.submitting.set(false); this.closeForm(); this.loadData(); },
      error: () => { this.toastSvc.error('Erreur.'); this.submitting.set(false); }
    });
  }

  remove(eq: Equipement): void {
    if (!confirm(`Supprimer "${eq.nom_eq}" ?`)) return;
    this.equipementSvc.delete(eq.id).subscribe({
      next: () => { this.toastSvc.success('Supprimé.'); this.loadData(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
