import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { BonEntreeService } from '../../services/bon-entree.service';
import { FournisseurInterneService } from '../../services/fournisseur-interne.service';
import { ProductService } from '../../services/product.service';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BonEntree } from '../../models/bon-entree.model';
import { FournisseurInterne } from '../../models/fournisseur-interne.model';
import { Product } from '../../models/product.interface';
import { Complexe } from '../../models/complexe.model';

@Component({
  selector: 'app-admin-bon-entree',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-bon-entree.component.html',
  styleUrls: ['./admin-bon-entree.component.css']
})
export class AdminBonEntreeComponent implements OnInit {
  private readonly bonEntreeSvc = inject(BonEntreeService);
  private readonly fournisseurSvc = inject(FournisseurInterneService);
  private readonly productSvc = inject(ProductService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly authSvc = inject(AuthService);
  private readonly toastSvc = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  bons = signal<BonEntree[]>([]);
  fournisseurs = signal<FournisseurInterne[]>([]);
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

  get total(): number {
    return this.lignes.controls.reduce((sum, ctrl) => {
      const qty = Number(ctrl.get('quantite')?.value) || 0;
      const prix = Number(ctrl.get('prix_unitaire')?.value) || 0;
      return sum + qty * prix;
    }, 0);
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
      fournisseur_interne_id: ['', Validators.required],
      complexe_id: ['', Validators.required],
      date_bon_ent: ['', Validators.required],
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
      quantite: [1, [Validators.required, Validators.min(1)]],
      prix_unitaire: ['', Validators.required]
    });
  }

  addLigne(): void {
    const lgn = this.createLigne();
    lgn.get('produit_id')!.valueChanges.subscribe(pid => {
      const all = this.products();
      const prod = all.find(p => p.id === +pid);
      if (prod) lgn.get('prix_unitaire')!.setValue(prod.prix_achat ?? 0);
    });
    this.lignes.push(lgn);
  }

  removeLigne(i: number): void {
    if (this.lignes.length > 1) this.lignes.removeAt(i);
  }

  loadData(): void {
    this.loading.set(true);
    this.bonEntreeSvc.list().subscribe({
      next: (res) => { this.bons.set(res.data); this.loading.set(false); },
      error: () => { this.toastSvc.error('Erreur lors du chargement.'); this.loading.set(false); }
    });
    this.productSvc.list({ per_page: 200 }).subscribe({
      next: (res) => { this.products.set(res.data); this.filterProducts(); },
      error: () => {}
    });

    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.complexes.set([(user as any).complexe]);
      this.bonForm.patchValue({ complexe_id: (user as any).complexe.id });
    } else {
      this.complexeSvc.list().subscribe({ next: (res) => this.complexes.set(res) });
    }

    this.fournisseurSvc.list({ actif: true }).subscribe({
      next: (res) => this.fournisseurs.set(res.data),
      error: () => {}
    });
  }

  openForm(): void {
    this.bonForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
    const user = this.authSvc.currentUser();
    if (user?.role === 'GERANT' && (user as any).complexe) {
      this.bonForm.patchValue({ complexe_id: (user as any).complexe.id, date_bon_ent: this.today });
    } else {
      this.bonForm.patchValue({ date_bon_ent: this.today });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.bonForm.invalid) return;
    this.submitting.set(true);
    const raw = this.bonForm.getRawValue();
    this.bonEntreeSvc.create(raw).subscribe({
      next: (res) => {
        const ref = res.reference;
        this.toastSvc.success(ref ? `Bon d'entrée créé — Réf: ${ref}` : "Bon d'entrée créé.");
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || "Erreur lors de l'enregistrement.");
        this.submitting.set(false);
      }
    });
  }
}
