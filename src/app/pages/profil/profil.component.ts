import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { ImageUploadComponent } from '../../components/shared/image-upload/image-upload.component';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ImageUploadComponent],
  templateUrl: './profil.component.html',
  styles: [`
    :host { display: block; }
  `]
})
export class ProfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileSvc = inject(ProfileService);
  private toastSvc = inject(ToastService);

  loading = signal(true);
  submitting = signal(false);
  avatarUrl = signal<string | null>(null);

  profileForm = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: [{ value: '', disabled: true }],
    phone: ['', [Validators.maxLength(20)]],
    address: ['', [Validators.maxLength(255)]],
    date_naissance: ['' as string | null],
    sexe: ['' as 'homme' | 'femme' | 'autre' | ''],
    profession: ['', [Validators.maxLength(100)]],
    image_url: ['' as string | null]
  });

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.loading.set(true);
    this.profileSvc.getProfile().subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          date_naissance: user.date_naissance ? user.date_naissance.substring(0, 10) : null,
          sexe: user.sexe || '',
          profession: user.profession || '',
          image_url: user.image_url || null
        });
        this.avatarUrl.set(user.image_url || null);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement du profil.');
        this.loading.set(false);
      }
    });
  }

  onImageUploaded(url: string) {
    this.avatarUrl.set(url);
    this.profileForm.patchValue({ image_url: url });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.submitting.set(true);

    const raw = this.profileForm.getRawValue();
    const payload: Partial<User> = {
      first_name: raw.first_name || '',
      last_name: raw.last_name || '',
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      date_naissance: raw.date_naissance || null,
      sexe: raw.sexe || undefined,
      profession: raw.profession || undefined,
      image_url: raw.image_url || null
    };

    this.profileSvc.updateProfile(payload).subscribe({
      next: (user) => {
        this.toastSvc.success('Profil mis à jour avec succès ✓');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastSvc.error(err?.error?.message || 'Erreur lors de la mise à jour du profil');
      }
    });
  }
}
