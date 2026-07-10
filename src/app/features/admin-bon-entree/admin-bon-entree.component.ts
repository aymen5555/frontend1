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
  submittedAttempt = false;
  selectedBon = signal<BonEntree | null>(null);
  loadingDetail = signal(false);

  selectedComplexeId = signal<number | null>(null);

  bonForm!: FormGroup;
  paymentModalVisible = false;
  paymentForm!: FormGroup;

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
    this.buildPaymentForm();
    this.loadData();
  }

  buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      montant: ['', [Validators.required, Validators.min(0.01)]],
      modalite_paiement: [''],
      reference: ['']
    });
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

    this.complexeSvc.list().subscribe({
      next: (res) => {
        this.complexes.set(res);
        if (res.length && this.authSvc.currentUser()?.role === 'GERANT') {
          this.bonForm.patchValue({ complexe_id: res[0].id });
        }
      }
    });

    this.fournisseurSvc.list({ actif: true }).subscribe({
      next: (res) => this.fournisseurs.set(res.data),
      error: () => {}
    });
  }

  viewBon(id: number): void {
    this.loadingDetail.set(true);
    this.bonEntreeSvc.get(id).subscribe({
      next: (res) => {
        this.selectedBon.set(res.data);
        this.loadingDetail.set(false);
        this.showForm.set(false);
      },
      error: () => {
        this.toastSvc.error('Erreur lors du chargement du bon.');
        this.loadingDetail.set(false);
      }
    });
  }

  closeDetail(): void { this.selectedBon.set(null); }

  printBon(): void {
    const b = this.selectedBon();
    if (!b) return;
    const html = `
      <html>
      <head>
        <title>Bon d'entrée ${b.reference}</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{text-transform:uppercase;font-size:12px}</style>
      </head>
      <body>
        <h2>Bon d'entrée — ${b.reference}</h2>
        <p>Date: ${new Date(b.date_bon_ent).toLocaleDateString()}<br/>Fournisseur: ${b.fournisseur_interne?.nom_f_int ?? b.fournisseurInterne?.nom_f_int ?? ''}</p>
        <table>
          <thead><tr><th>Produit</th><th>Réf</th><th>Qté</th><th>Prix Unitaire</th><th>Sous-total</th></tr></thead>
          <tbody>
            ${b.lignes.map(l => {
              const qty = (l as any).quantite_entree_lig_bon_ent ?? (l as any).quantite ?? 0;
              const unit = (l as any).prix_unitaire_dachat_lig_bon_ent ?? (l as any).prix_unitaire ?? l.produit?.prix ?? 0;
              const sub = (Number(unit) * Number(qty)).toFixed(2);
              return `<tr><td>${l.produit?.nom ?? 'Prod #' + l.produit_id}</td><td>${l.produit?.reference ?? ''}</td><td style="text-align:center">${qty}</td><td style="text-align:right">${Number(unit).toFixed(2)}</td><td style="text-align:right">${sub}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        <h3 style="text-align:right">Total: ${(b.total_ttc_bon_ent ?? b.lignes.reduce((s:any,ln:any)=>s + (Number((ln as any).prix_unitaire ?? ln.produit?.prix ?? 0) * ((ln as any).quantite_entree_lig_bon_ent ?? (ln as any).quantite ?? 0)),0)).toFixed(2)} TND</h3>
      </body></html>
    `;
    const w = window.open('', '_blank');
    if (!w) { this.toastSvc.error('Impossible d\'ouvrir la fenêtre d\'impression.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  }

  get remaining(): number {
    const b = this.selectedBon();
    if (!b) return 0;
    const paid = Number(b.montant_paye || 0);
    return Math.max(0, Number(b.total_ttc_bon_ent || 0) - paid);
  }

  openPaymentModal(): void {
    const b = this.selectedBon();
    if (!b) return;
    this.paymentForm.reset({ montant: this.remaining.toFixed(2), modalite_paiement: '', reference: '' });
    this.paymentModalVisible = true;
  }

  closePaymentModal(): void {
    this.paymentModalVisible = false;
  }

  confirmPayment(): void {
    if (this.paymentForm.invalid) return;
    const b = this.selectedBon();
    if (!b) return;
    const payload = this.paymentForm.getRawValue();
    this.bonEntreeSvc.confirmPayment(b.id, payload).subscribe({
      next: (res) => {
        this.toastSvc.success('Paiement enregistré');
        this.selectedBon.set(res.data?.bon ?? res.data ?? null);
        this.closePaymentModal();
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement')
    });
  }

  openForm(): void {
    this.bonForm.reset();
    while (this.lignes.length) this.lignes.removeAt(0);
    this.addLigne();
    const user = this.authSvc.currentUser();
    if (this.complexes().length && user?.role === 'GERANT') {
      this.bonForm.patchValue({ complexe_id: this.complexes()[0].id, date_bon_ent: this.today });
    } else {
      this.bonForm.patchValue({ date_bon_ent: this.today });
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    this.submittedAttempt = true;
    // mark all controls touched, including nested lignes
    Object.values(this.bonForm.controls).forEach(c => c.markAsTouched());
    this.lignes.controls.forEach(l => Object.values((l as FormGroup).controls).forEach(sc => sc.markAsTouched()));
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
        this.submitting.set(false);
        if (err?.status === 422 && err?.error?.errors) {
          const errors = err.error.errors;
          Object.keys(errors).forEach(key => {
            // handle nested ligne errors like 'lignes.0.produit_id'
            if (key.startsWith('lignes.')) {
              const parts = key.split('.');
              const idx = Number(parts[1]);
              const field = parts.slice(2).join('.');
              const msg = errors[key][0];
              const ligne = this.lignes.at(idx) as FormGroup | undefined;
              if (ligne && ligne.controls[field]) {
                ligne.controls[field].setErrors({ server: msg });
              }
              return;
            }
            if (this.bonForm.controls[key]) {
              this.bonForm.controls[key].setErrors({ server: errors[key][0] });
            }
          });
          this.toastSvc.error('Erreur de validation — veuillez vérifier les champs.');
          return;
        }
        this.toastSvc.error(err?.error?.message || "Erreur lors de l'enregistrement.");
      }
    });
  }
}
