import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { BonSortieService } from '../../services/bon-sortie.service';
import { ProductService } from '../../services/product.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BonSortie } from '../../models/bon-sortie.model';
import { Product } from '../../models/product.interface';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-bon-sortie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-bon-sortie.component.html',
  styleUrls: ['./admin-bon-sortie.component.css']
})
export class AdminBonSortieComponent implements OnInit {
  private readonly bonSortieSvc = inject(BonSortieService);
  private readonly productSvc = inject(ProductService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  bons = signal<BonSortie[]>([]);
  products = signal<Product[]>([]);
  complexes = signal<Complexe[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);

  selectedComplexeId = signal<number | null>(null);

  bonForm!: FormGroup;

  get lignes(): FormArray {
    return this.bonForm.get('lignes') as FormArray;
  }

  get today(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  filteredProducts = signal<Product[]>([]);

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.bonForm = this.fb.group({
      complexe_id: ['', Validators.required],
      date_bon_sor: ['', Validators.required],
      motif: [''],
      lignes: this.fb.array([])
    });

    this.bonForm.get('complexe_id')!.valueChanges.subscribe(val => {
      this.selectedComplexeId.set(val ? +val : null);
      this.filterProducts();
      this.lignes.controls.forEach(lgn => lgn.get('produit_id')!.reset(''));
    });

    this.addLigne();
  }

  filterProducts(): void {
    const cid = this.selectedComplexeId();
    this.filteredProducts.set(cid ? this.products().filter(p => p.complexe_id === cid) : this.products());
  }

  createLigne(): FormGroup {
    return this.fb.group({
      produit_id: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addLigne(): void {
    this.lignes.push(this.createLigne());
  }

  removeLigne(i: number): void {
    if (this.lignes.length > 1) this.lignes.removeAt(i);
  }

  getStock(productId: any): number {
    if (!productId) return 0;
    const id = Number(productId);
    const p = this.products().find(pr => pr.id === id);
    return p?.stock?.quantite_disponible ?? 0;
  }

  isStockWarning(ctrl: any): boolean {
    const pid = ctrl.get('produit_id')?.value;
    const qty = ctrl.get('quantite')?.value;
    if (!pid || !qty) return false;
    const stock = this.getStock(pid);
    return qty > stock;
  }

  loadData(): void {
    this.loading.set(true);
    this.bonSortieSvc.list().subscribe({
      next: (res) => { this.bons.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement.'); this.loading.set(false); }
    });
    this.productSvc.list({ per_page: 200 }).subscribe({
      next: (res) => { this.products.set(res.data); this.filterProducts(); },
      error: () => {}
    });

    this.complexeSvc.list().subscribe({
      next: (res) => {
        this.complexes.set(res);
        if (res.length && this.authSvc.currentUser()?.role === 'GERANT') {
          this.bonForm.patchValue({ complexe_id: res[0].id });
        }
      }
    });
  }

  openForm(): void {
    this.bonForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
    const user = this.authSvc.currentUser();
    if (this.complexes().length && user?.role === 'GERANT') {
      this.bonForm.patchValue({ complexe_id: this.complexes()[0].id, date_bon_sor: this.today });
    } else {
      this.bonForm.patchValue({ date_bon_sor: this.today });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.bonForm.invalid) return;
    this.submitting.set(true);
    const raw = this.bonForm.getRawValue();
    this.bonSortieSvc.create(raw).subscribe({
      next: (res) => {
        const ref = res.reference;
        this.toastSvc.success(ref ? `Bon de sortie créé — Réf: ${ref}` : 'Bon de sortie créé.');
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
}
