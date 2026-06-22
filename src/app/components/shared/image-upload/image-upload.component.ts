import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../services/toast.service';
 
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  private readonly http = inject(HttpClient);
  private readonly toastSvc = inject(ToastService);
 
  // Inputs & Outputs (Angular 17+ signal style)
  imageUrl = input<string | null>(null);
  imageUploaded = output<string>();
 
  uploading = signal(false);
  dragOver = signal(false);
 
  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.uploadFile(inputEl.files[0]);
    }
  }
 
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }
 
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }
 
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }
 
  private uploadFile(file: File): void {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toastSvc.error('Format invalide. Formats acceptés : JPG, PNG, WEBP.');
      return;
    }
 
    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastSvc.error('Le fichier est trop lourd. Maximum : 5 Mo.');
      return;
    }
 
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('image', file);
 
    this.http.post<{ success: boolean; url: string }>(
      `${environment.apiUrl}/admin/upload-image`,
      formData
    ).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.toastSvc.success('Photo téléversée avec succès.');
        this.imageUploaded.emit(res.url);
      },
      error: (err) => {
        this.uploading.set(false);
        const errs = err?.error?.errors;
        const msg = errs
          ? (Object.values(errs)[0] as string[])?.[0]
          : err?.error?.message;
        this.toastSvc.error(msg || 'Échec du téléversement de la photo.');
      }
    });
  }
}
