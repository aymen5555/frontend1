import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/category.interface';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css']
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categorySvc = inject(CategoryService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<Category | null>(null);
  submitting = signal(false);

  categoryForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.categoryForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      active: [true]
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.categorySvc.adminList().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement des catégories.');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editing.set(null);
    this.categoryForm.reset({ active: true });
    this.showForm.set(true);
  }

  openEditForm(category: Category): void {
    this.editing.set(category);
    this.categoryForm.patchValue({
      nom: category.nom,
      description: category.description || '',
      active: category.active
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
    this.categoryForm.reset();
  }

  save(): void {
    if (this.categoryForm.invalid) return;
    this.submitting.set(true);
    const vals = this.categoryForm.value;

    const req = this.editing()
      ? this.categorySvc.update(this.editing()!.id, vals)
      : this.categorySvc.create(vals);

    req.subscribe({
      next: () => {
        this.toastSvc.success(this.editing() ? 'Catégorie mise à jour.' : 'Catégorie créée.');
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

  toggleActive(category: Category): void {
    const nextState = !category.active;
    this.categorySvc.update(category.id, { active: nextState }).subscribe({
      next: () => {
        this.toastSvc.success(`Catégorie ${nextState ? 'activée' : 'désactivée'}.`);
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
    });
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Supprimer la catégorie "${category.nom}" ? Cette action peut impacter les produits existants.`)) return;
    this.categorySvc.delete(category.id).subscribe({
      next: (res) => {
        this.toastSvc.success(res.message || 'Catégorie supprimée.');
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la suppression.')
    });
  }
}
