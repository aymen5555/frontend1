import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SocieteService } from '../../services/societe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Societe } from '../../models/societe.model';

@Component({
  selector: 'app-admin-societes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-societes.component.html',
  styleUrls: ['./admin-societes.component.css']
})
export class AdminSocietesComponent implements OnInit {
  private readonly societeSvc = inject(SocieteService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  societes = signal<Societe[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Societe | null>(null);
  submitting = signal(false);
  selectedSociete = signal<Societe | null>(null);
  dirigeants = signal<any[]>([]);
  showDirigeantForm = signal(false);
  dirigeantSubmitting = signal(false);

  societeForm!: FormGroup;
  dirigeantForm!: FormGroup;

  ngOnInit(): void {
    this.buildForms();
    this.loadData();
  }

  buildForms(): void {
    this.societeForm = this.fb.group({
      nom_soc: ['', Validators.required],
      image: [''],
      description: [''],
      telephone: [''],
      date_de_creation: [''],
    });
    this.dirigeantForm = this.fb.group({
      nom_dir: ['', Validators.required],
      image: [''],
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.societeSvc.list().subscribe({
      next: (res) => { this.societes.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.societeForm.reset();
    this.showForm.set(true);
    this.selectedSociete.set(null);
  }

  openEdit(s: Societe): void {
    this.editing.set(s);
    this.societeForm.patchValue({
      nom_soc: s.nom_soc,
      image: s.image || '',
      description: s.description || '',
      telephone: s.telephone || '',
      date_de_creation: s.date_de_creation || '',
    });
    this.showForm.set(true);
    this.loadDirigeants(s.id);
  }

  selectSociete(s: Societe): void {
    this.selectedSociete.set(s);
    this.loadDirigeants(s.id);
  }

  closeForm(): void { this.showForm.set(false); this.editing.set(null); }

  save(): void {
    if (this.societeForm.invalid) return;
    this.submitting.set(true);
    const vals = this.societeForm.value;
    const req = this.editing() ? this.societeSvc.update(this.editing()!.id, vals) : this.societeSvc.create(vals);
    req.subscribe({
      next: (res) => { this.toastSvc.success(this.editing() ? 'Société modifiée.' : 'Société créée.'); this.submitting.set(false); this.closeForm(); this.loadData(); if (res.data) { this.selectSociete(res.data); } },
      error: () => { this.toastSvc.error('Erreur.'); this.submitting.set(false); }
    });
  }

  delete(s: Societe): void {
    if (!confirm(`Supprimer "${s.nom_soc}" ?`)) return;
    this.societeSvc.delete(s.id).subscribe({
      next: () => { this.toastSvc.success('Société supprimée.'); this.loadData(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }

  loadDirigeants(societeId: number): void {
    this.societeSvc.listDirigeants(societeId).subscribe({
      next: (res) => this.dirigeants.set(res.data),
      error: () => this.dirigeants.set([])
    });
  }

  addDirigeantWithInput(name: string): void {
    if (!name?.trim()) return;
    const sid = this.selectedSociete()?.id;
    if (!sid) return;
    this.dirigeantSubmitting.set(true);
    this.societeSvc.addDirigeant(sid, { nom_dir: name.trim() }).subscribe({
      next: () => { this.toastSvc.success('Dirigeant ajouté.'); this.dirigeantSubmitting.set(false); this.loadDirigeants(sid); },
      error: () => { this.toastSvc.error('Erreur.'); this.dirigeantSubmitting.set(false); }
    });
  }

  removeDirigeant(dirigeantId: number): void {
    if (!confirm('Supprimer ce dirigeant ?')) return;
    const sid = this.selectedSociete()?.id;
    if (!sid) return;
    this.societeSvc.removeDirigeant(sid, dirigeantId).subscribe({
      next: () => { this.toastSvc.success('Dirigeant supprimé.'); this.loadDirigeants(sid); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
