import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { CategoryItem } from '../../models/category.interface';

type TabType = 'produit' | 'abonnement-adherent' | 'fournisseur' | 'ressource';

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

  categories = signal<CategoryItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal<CategoryItem | null>(null);
  submitting = signal(false);
  activeTab: TabType = 'produit';

  tabs: { key: TabType; label: string }[] = [
    { key: 'produit', label: 'Produits' },
    { key: 'abonnement-adherent', label: 'Abonnements' },
    { key: 'fournisseur', label: 'Fournisseurs' },
    { key: 'ressource', label: 'Ressources' },
  ];

  categoryForm!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.categoryForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      active: [true]
    });
  }

  switchTab(tab: TabType): void {
    this.activeTab = tab;
    this.showForm.set(false);
    this.editing.set(null);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.categorySvc.adminList(this.activeTab).subscribe({
      next: (res) => { this.categories.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur chargement catégories.'); this.loading.set(false); }
    });
  }

  openCreateForm(): void {
    this.editing.set(null);
    this.categoryForm.reset({ active: true });
    this.showForm.set(true);
  }

  openEditForm(category: CategoryItem): void {
    this.editing.set(category);
    this.categoryForm.patchValue({
      nom: category.nom,
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
      ? this.categorySvc.update(this.activeTab, this.editing()!.id, vals)
      : this.categorySvc.create(this.activeTab, vals);

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

  toggleActive(category: CategoryItem): void {
    const nextState = !category.active;
    this.categorySvc.update(this.activeTab, category.id, { active: nextState }).subscribe({
      next: () => {
        this.toastSvc.success(`Catégorie ${nextState ? 'activée' : 'désactivée'}.`);
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur.')
    });
  }

  deleteCategory(category: CategoryItem): void {
    if (!confirm(`Supprimer la catégorie "${category.nom}" ?`)) return;
    this.categorySvc.delete(this.activeTab, category.id).subscribe({
      next: (res) => {
        this.toastSvc.success(res.message || 'Catégorie supprimée.');
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la suppression.')
    });
  }
}
