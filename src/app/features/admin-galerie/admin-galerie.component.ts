import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { GalerieService } from '../../services/galerie.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Galerie } from '../../models/galerie.model';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-galerie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-galerie.component.html',
  styleUrls: ['./admin-galerie.component.css']
})
export class AdminGalerieComponent implements OnInit {
  private readonly galerieSvc = inject(GalerieService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  galeries = signal<Galerie[]>([]);
  complexes = signal<Complexe[]>([]);
  selectedComplexeId = signal<number | null>(null);
  loading = signal(true);
  showUpload = signal(false);
  uploading = signal(false);
  pendingFiles: { file: File; preview: string }[] = [];

  ngOnInit(): void {
    this.loadComplexes();
    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.complexes.set([(user as any).complexe]);
      this.selectedComplexeId.set((user as any).complexe.id);
      this.loadGaleries();
    } else {
      this.complexeSvc.getAll().subscribe({
        next: (res) => {
          this.complexes.set(res);
          if (res.length) {
            this.selectedComplexeId.set(res[0].id);
            this.loadGaleries();
          } else {
            this.loading.set(false);
          }
        },
        error: () => { this.toastSvc.error('Erreur chargement complexes.'); this.loading.set(false); }
      });
    }
  }

  loadComplexes(): void {
    if (this.authSvc.currentUser()?.role === 'GERANT' && (this.authSvc.currentUser() as any).complexe) {
      this.complexes.set([(this.authSvc.currentUser() as any).complexe]);
    } else {
      this.complexeSvc.getAll().subscribe({ next: (res) => this.complexes.set(res) });
    }
  }

  onComplexeChange(): void {
    this.loadGaleries();
  }

  loadGaleries(): void {
    const cid = this.selectedComplexeId();
    if (!cid) { this.galeries.set([]); this.loading.set(false); return; }
    this.loading.set(true);
    this.galerieSvc.list(cid).subscribe({
      next: (res) => { this.galeries.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement galerie.'); this.loading.set(false); }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files).slice(0, 10 - this.galeries().length - this.pendingFiles.length);
    files.forEach(f => {
      this.pendingFiles.push({ file: f, preview: URL.createObjectURL(f) });
    });
    this.showUpload.set(this.pendingFiles.length > 0);
    input.value = '';
  }

  uploadImages(): void {
    const cid = this.selectedComplexeId();
    if (!cid || !this.pendingFiles.length) return;
    this.uploading.set(true);
    let completed = 0;
    const total = this.pendingFiles.length;

    this.pendingFiles.forEach((pf, idx) => {
      const url = pf.preview; // In production, upload to ImageKit first
      this.galerieSvc.create(cid, { image_g: url, ordre: this.galeries().length + idx }).subscribe({
        next: () => { completed++; if (completed === total) { this.pendingFiles = []; this.uploading.set(false); this.showUpload.set(false); this.loadGaleries(); this.toastSvc.success('Images ajoutées.'); } },
        error: () => { completed++; if (completed === total) { this.pendingFiles = []; this.uploading.set(false); this.showUpload.set(false); this.loadGaleries(); this.toastSvc.error('Certaines images ont échoué.'); } }
      });
    });
  }

  cancelUpload(): void {
    this.pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    this.pendingFiles = [];
    this.showUpload.set(false);
  }

  removeGalerie(galerie: Galerie): void;
  removeGalerie(pf: { file: File; preview: string }): void;
  removeGalerie(target: any): void {
    const idx = this.pendingFiles.indexOf(target);
    if (idx !== -1) {
      this.pendingFiles.splice(idx, 1);
      if (this.pendingFiles.length === 0) this.showUpload.set(false);
      URL.revokeObjectURL(target.preview);
      return;
    }
    if (!confirm('Supprimer cette image ?')) return;
    const cid = this.selectedComplexeId();
    if (!cid) return;
    this.galerieSvc.delete(cid, target.id).subscribe({
      next: () => { this.toastSvc.success('Image supprimée.'); this.loadGaleries(); },
      error: () => this.toastSvc.error('Erreur suppression.')
    });
  }
}
