import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { DirectSale } from '../../models/sale.interface';
import { Product } from '../../models/product.interface';

@Component({
  selector: 'app-admin-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-sales.component.html',
  styleUrls: ['./admin-sales.component.css']
})
export class AdminSalesComponent implements OnInit {
  private readonly saleSvc = inject(SaleService);
  private readonly productSvc = inject(ProductService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  sales = signal<DirectSale[]>([]);
  products = signal<Product[]>([]);
  complexes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);

  selectedComplexeId = signal<number | null>(null);

  saleForm!: FormGroup;

  /** Products filtered by the currently selected complexe — reactive via signals */
  filteredProducts = computed(() => {
    const complexeId = this.selectedComplexeId();
    if (!complexeId) return [];
    return this.products().filter(p => p.complexe_id === complexeId);
  });

  get lignes(): FormArray {
    return this.saleForm.get('lignes') as FormArray;
  }

  get total(): number {
    return this.lignes.controls.reduce((sum, ctrl) => {
      const qty = Number(ctrl.get('quantite')?.value) || 0;
      const prix = Number(ctrl.get('prix_unitaire')?.value) || 0;
      return sum + qty * prix;
    }, 0);
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }

  buildForm(): void {
    this.saleForm = this.fb.group({
      complexe_id: ['', Validators.required],
      client_nom: [''],
      modalite_paiement: ['especes', Validators.required],
      lignes: this.fb.array([])
    });

    // Sync selectedComplexeId signal with the form control — triggers reactive filteredProducts
    this.saleForm.get('complexe_id')!.valueChanges.subscribe(val => {
      this.selectedComplexeId.set(val ? +val : null);
      // Reset all product selections when complexe changes
      this.lignes.controls.forEach(lgn => lgn.get('produit_id')!.reset(''));
    });

    this.addLigne();
  }

  createLigne(): FormGroup {
    return this.fb.group({
      produit_id: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      prix_unitaire: [{ value: '', disabled: true }]
    });
  }

  addLigne(): void {
    const lgn = this.createLigne();
    // Auto-fill price when product selected
    lgn.get('produit_id')!.valueChanges.subscribe(pid => {
      const allProducts = this.products();
      const prod = allProducts.find(p => p.id === +pid);
      if (prod) lgn.get('prix_unitaire')!.setValue(prod.prix);
    });
    this.lignes.push(lgn);
  }

  removeLigne(i: number): void {
    if (this.lignes.length > 1) this.lignes.removeAt(i);
  }

  /** Called when complexe <select> changes — sync the signal */
  onComplexeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const val = select.value;
    this.selectedComplexeId.set(val ? +val : null);
    this.lignes.controls.forEach(lgn => lgn.get('produit_id')!.reset(''));
  }

  loadData(): void {
    this.loading.set(true);
    this.saleSvc.list().subscribe({
      next: (res) => { this.sales.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement.'); this.loading.set(false); }
    });
    this.productSvc.list({ per_page: 200 }).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
    this.complexeSvc.list().subscribe({
      next: (res) => {
        this.complexes.set(res);
        if (res.length && (this.authSvc.currentUser()?.role === 'GERANT' || res.length === 1)) {
          this.saleForm.patchValue({ complexe_id: res[0].id });
        }
      }
    });
  }

  openForm(): void {
    this.saleForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
    const user = this.authSvc.currentUser();
    if (this.complexes().length && user?.role === 'GERANT') {
      this.saleForm.patchValue({ complexe_id: this.complexes()[0].id, modalite_paiement: 'especes' });
    } else {
      this.saleForm.patchValue({ modalite_paiement: 'especes' });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.saleForm.invalid) return;
    this.submitting.set(true);
    const raw = this.saleForm.getRawValue();
    const payload = {
      complexe_id: raw.complexe_id,
      client_nom: raw.client_nom,
      modalite_paiement: raw.modalite_paiement,
      lignes: raw.lignes.map((ligne: any) => ({
        produit_id: ligne.produit_id,
        quantite: ligne.quantite,
      })),
    };

    this.saleSvc.create(payload).subscribe({
      next: (res) => {
        const ref = res?.data?.reference;
        this.toastSvc.success(ref ? `Vente enregistrée — Réf: ${ref}` : 'Vente directe enregistrée.');
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

  generateRef(): void {
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-5);
    this.saleForm.get('reference')!.setValue(`TXN-${year}-${seq}`);
  }

  getProductName(id: number): string {
    return this.products().find(p => p.id === id)?.nom || `Produit #${id}`;
  }
}
