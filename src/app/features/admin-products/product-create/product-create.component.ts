import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ComplexeService } from '../../../services/complexe.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Category } from '../../../models/category.interface';
import { Complexe } from '../../../models/complexe.model';
import { Product } from '../../../models/product.interface';
import { ImageUploadComponent } from '../../../components/shared/image-upload/image-upload.component';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css']
})
export class ProductCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productSvc = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  productForm!: FormGroup;
  categories = signal<Category[]>([]);
  complexes = signal<Complexe[]>([]);
  isEditMode = signal(false);
  productId = signal<number | null>(null);
  loading = signal(false);
  submitting = signal(false);
  submittedAttempt = false;
  imagePlaceholder = 'https://... (URL valide requise, ex: https://exemple.com/photo.jpg)';

  sports = [
    { value: 'football', label: 'Football' },
    { value: 'padel', label: 'Padel' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'natation', label: 'Natation' },
    { value: 'musculation', label: 'Musculation' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'handball', label: 'Handball' },
    { value: 'general', label: 'Général/Multi' }
  ];

  levels = [
    { value: 'tous', label: 'Tous les niveaux' },
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'expert', label: 'Expert' }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.loadSelectors();

    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(Number(id));
      this.loadProductForEdit(Number(id));
    }
  }

  buildForm(): void {
    this.productForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      categorie_id: ['', [Validators.required]],
      complexe_id: ['', [Validators.required]],
      prix: [0, [Validators.required, Validators.min(0)]],
      prix_achat: [null, [Validators.min(0)]],
      sport_cible: ['general', [Validators.required]],
      niveau_cible: ['tous', [Validators.required]],
      image: [''],
      reference: [''],
      // Only validated on create mode
      quantite_initiale: [0, [Validators.required, Validators.min(0)]],
      quantite_minimale: [5, [Validators.required, Validators.min(1)]],
      // Only validated on edit mode
      actif: [true]
    });

    // Form-level validator: prix_achat must be <= prix when provided
    this.productForm.setValidators(this.prixAchatNotGreaterThanPrix.bind(this));

    // Subscribe to name changes (no longer auto-generates placeholder URL)

    // Remove stock fields validation if we are in Edit Mode
    if (this.isEditMode()) {
      this.productForm.get('quantite_initiale')?.clearValidators();
      this.productForm.get('quantite_initiale')?.updateValueAndValidity();
      this.productForm.get('quantite_minimale')?.clearValidators();
      this.productForm.get('quantite_minimale')?.updateValueAndValidity();
    }
  }

  loadSelectors(): void {
    this.categorySvc.list().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.toastSvc.error('Erreur lors du chargement des catégories.')
    });

    // For complexes: if user is Gérant, show only their assigned complexe
    const user = this.authSvc.currentUser();
    if (user && (user.role || '').toLowerCase() === 'gerant') {
      const gerantComplexe = user.complexe;
      if (gerantComplexe) {
        this.complexes.set([gerantComplexe as any]);
        this.productForm.patchValue({ complexe_id: gerantComplexe.id });
      }
    } else {
      this.complexeSvc.list().subscribe({
        next: (res) => {
          this.complexes.set(res);
        },
        error: () => this.toastSvc.error('Erreur lors du chargement des complexes.')
      });
    }
  }

  isGerant(): boolean {
    const u = this.authSvc.currentUser();
    return !!u && ((u.role || '').toLowerCase() === 'gerant');
  }

  loadProductForEdit(id: number): void {
    this.loading.set(true);
    this.productSvc.get(id).subscribe({
      next: (res) => {
        const prod = res.data;
        this.productForm.patchValue({
          nom: prod.nom,
          description: prod.description,
          categorie_id: prod.categorie?.id,
          complexe_id: prod.complexe?.id,
          prix: prod.prix,
          prix_achat: prod.prix_achat,
          sport_cible: prod.sport_cible,
          niveau_cible: prod.niveau_cible,
          image: prod.image,
          reference: prod.reference,
          actif: prod.actif
        });
        if (prod.nom) {
          // placeholder is now static, no update needed
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement du produit.');
        this.router.navigate(['/admin/products']);
        this.loading.set(false);
      }
    });
  }

  saveProduct(): void {
    this.submittedAttempt = true;
    Object.values(this.productForm.controls).forEach(c => c.markAsTouched());
    if (this.productForm.invalid) return;

    this.submitting.set(true);
    const rawVal = this.productForm.value;

    if (this.isEditMode()) {
      const payload = {
        nom: rawVal.nom,
        description: rawVal.description || null,
        categorie_id: Number(rawVal.categorie_id),
        complexe_id: Number(rawVal.complexe_id),
        prix: Number(rawVal.prix),
        prix_achat: rawVal.prix_achat !== null ? Number(rawVal.prix_achat) : null,
        sport_cible: rawVal.sport_cible,
        niveau_cible: rawVal.niveau_cible,
        image: rawVal.image || null,
        reference: rawVal.reference || null,
        actif: !!rawVal.actif
      };

      this.productSvc.update(this.productId()!, payload).subscribe({
        next: () => {
          this.toastSvc.success('Produit mis à jour avec succès.');
          this.submitting.set(false);
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err?.status === 422 && err?.error?.errors) {
            const errors = err.error.errors;
            Object.keys(errors).forEach(key => {
              if (this.productForm.controls[key]) {
                this.productForm.controls[key].setErrors({ server: errors[key][0] });
              }
            });
            this.toastSvc.error('Erreur de validation — veuillez vérifier les champs.');
            return;
          }
          const errs = err?.error?.errors;
          const msg = errs ? (Object.values(errs)[0] as string[])?.[0] : err?.error?.message;
          this.toastSvc.error(msg || 'Erreur lors de la mise à jour.');
        }
      });
    } else {
      const payload = {
        nom: rawVal.nom,
        description: rawVal.description || null,
        categorie_id: Number(rawVal.categorie_id),
        complexe_id: Number(rawVal.complexe_id),
        prix: Number(rawVal.prix),
        prix_achat: rawVal.prix_achat !== null ? Number(rawVal.prix_achat) : null,
        sport_cible: rawVal.sport_cible,
        niveau_cible: rawVal.niveau_cible,
        image: rawVal.image || null,
        reference: rawVal.reference || null,
        quantite_initiale: Number(rawVal.quantite_initiale),
        quantite_minimale: Number(rawVal.quantite_minimale)
      };

      this.productSvc.create(payload).subscribe({
        next: () => {
          this.toastSvc.success('Produit créé avec succès.');
          this.submitting.set(false);
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err?.status === 422 && err?.error?.errors) {
            const errors = err.error.errors;
            Object.keys(errors).forEach(key => {
              if (this.productForm.controls[key]) {
                this.productForm.controls[key].setErrors({ server: errors[key][0] });
              }
            });
            this.toastSvc.error('Erreur de validation — veuillez vérifier les champs.');
            return;
          }
          const errs = err?.error?.errors;
          const msg = errs ? (Object.values(errs)[0] as string[])?.[0] : err?.error?.message;
          this.toastSvc.error(msg || 'Erreur lors de la création.');
        }
      });
    }
  }

  private prixAchatNotGreaterThanPrix(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const prix = Number(group.get('prix')?.value) || 0;
    const prixAchatVal = group.get('prix_achat')?.value;
    if (prixAchatVal !== null && prixAchatVal !== undefined && prixAchatVal !== '') {
      const prixAchat = Number(prixAchatVal) || 0;
      return prixAchat <= prix ? null : { prix_achat_gt_prix: 'Le prix d\'achat ne peut pas être supérieur au prix de vente.' };
    }
    return null;
  }

  onImagePreviewError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  generateReference(): void {
    const sport = (this.productForm.get('sport_cible')?.value || 'GEN') as string;
    const sportCode = sport.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-5);
    const ref = `PRD-${sportCode}-${timestamp}`;
    this.productForm.get('reference')?.setValue(ref);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getCategoryIcon(categoryName?: string): string {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('raquette') || name.includes('balle') || name.includes('tennis') || name.includes('foot')) {
      return 'ti ti-ball';
    }
    if (name.includes('fitness') || name.includes('muscu') || name.includes('yoga') || name.includes('équipement')) {
      return 'ti ti-barbell';
    }
    if (name.includes('tenue') || name.includes('accessoire') || name.includes('vêtement') || name.includes('chaussure')) {
      return 'ti ti-shirt';
    }
    return 'ti ti-photo-off';
  }

  getCategoryIconById(id: any): string {
    const catId = Number(id);
    const cat = this.categories().find(c => c.id === catId);
    return this.getCategoryIcon(cat?.nom);
  }
}
