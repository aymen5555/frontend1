import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GalerieService } from '../../services/galerie.service';
import { ComplexeService } from '../../services/complexe.service';
import { ToastService } from '../../services/toast.service';
import { Galerie } from '../../models/galerie.model';
import { Complexe } from '../../models/complexe.model';
import { environment } from '../../../environments/environment';
import { forkJoin, from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-galerie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-galerie.component.html',
  styleUrls: ['./admin-galerie.component.css']
})
export class AdminGalerieComponent implements OnInit {
  private readonly galerieSvc = inject(GalerieService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly toastSvc = inject(ToastService);
  private readonly http = inject(HttpClient);

  galeries = signal<Galerie[]>([]);
  complexes = signal<Complexe[]>([]);
  selectedComplexeId = signal<number | null>(null);
  loading = signal(true);
  showUpload = signal(false);
  uploading = signal(false);
  pendingFiles: { file: File; preview: string }[] = [];

  ngOnInit(): void {
    this.complexeSvc.list().subscribe({
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

  onComplexeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedComplexeId.set(val ? Number(val) : null);
    this.pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    this.pendingFiles = [];
    this.showUpload.set(false);
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
    const remaining = 10 - this.galeries().length - this.pendingFiles.length;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5 MB
    let rejected = 0;

    Array.from(input.files).slice(0, remaining).forEach(f => {
      if (!allowed.includes(f.type)) {
        this.toastSvc.error(`${f.name} : format non supporté (JPG, PNG, WEBP uniquement).`);
        rejected++;
        return;
      }
      if (f.size > maxSize) {
        this.toastSvc.error(`${f.name} : fichier trop lourd (max 5 Mo).`);
        rejected++;
        return;
      }
      this.pendingFiles.push({ file: f, preview: URL.createObjectURL(f) });
    });

    if (this.pendingFiles.length > 0) this.showUpload.set(true);
    input.value = '';
  }

  /** Upload all pending files: POST each to /admin/upload-image, then save URL to galerie */
  uploadImages(): void {
    const cid = this.selectedComplexeId();
    if (!cid || !this.pendingFiles.length) return;
    this.uploading.set(true);

    const uploads$: Observable<string>[] = this.pendingFiles.map(pf =>
      this.uploadOneFile(pf.file)
    );

    forkJoin(uploads$).subscribe({
      next: (urls) => {
        const saves$ = urls.map((url, idx) =>
          this.galerieSvc.create(cid, { image_g: url, ordre: this.galeries().length + idx })
        );
        forkJoin(saves$).subscribe({
          next: () => {
            this.pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
            this.pendingFiles = [];
            this.uploading.set(false);
            this.showUpload.set(false);
            this.loadGaleries();
            this.toastSvc.success('Images ajoutées à la galerie.');
          },
          error: () => {
            this.uploading.set(false);
            this.toastSvc.error('Certaines images n\'ont pas pu être enregistrées.');
            this.loadGaleries();
          }
        });
      },
      error: (err) => {
        this.uploading.set(false);
        const msg = err?.error?.message || 'Échec du téléversement.';
        this.toastSvc.error(msg);
      }
    });
  }

  private uploadOneFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return new Observable(observer => {
      this.http.post<{ success: boolean; data: { url: string } }>(
        `${environment.apiUrl}/admin/upload-image`,
        formData
      ).subscribe({
        next: (res) => { observer.next(res.data.url); observer.complete(); },
        error: (err) => observer.error(err)
      });
    });
  }

  cancelUpload(): void {
    this.pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    this.pendingFiles = [];
    this.showUpload.set(false);
  }

  removePending(pf: { file: File; preview: string }): void {
    const idx = this.pendingFiles.indexOf(pf);
    if (idx !== -1) {
      URL.revokeObjectURL(pf.preview);
      this.pendingFiles.splice(idx, 1);
    }
    if (this.pendingFiles.length === 0) this.showUpload.set(false);
  }

  removeGalerie(galerie: Galerie): void {
    if (!confirm('Supprimer cette image de la galerie ?')) return;
    const cid = this.selectedComplexeId();
    if (!cid) return;
    this.galerieSvc.delete(cid, galerie.id).subscribe({
      next: () => { this.toastSvc.success('Image supprimée.'); this.loadGaleries(); },
      error: () => this.toastSvc.error('Erreur lors de la suppression.')
    });
  }
}
