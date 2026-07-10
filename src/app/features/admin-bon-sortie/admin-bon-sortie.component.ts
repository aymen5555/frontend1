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
  submittedAttempt = false;
  selectedBon = signal<BonSortie | null>(null);
  loadingDetail = signal(false);
  paymentModalVisible = false;
  paymentForm!: FormGroup;

  selectedComplexeId = signal<number | null>(null);

  bonForm!: FormGroup;

  get remaining(): number {
    const b = this.selectedBon();
    if (!b) return 0;
    const paid = Number(b.montant_paye || 0);
    return Math.max(0, Number(b.total_ttc_bon_sor || 0) - paid);
  }

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

  viewBon(id: number): void {
    this.loadingDetail.set(true);
    this.bonSortieSvc.get(id).subscribe({
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
    this.bonSortieSvc.confirmPayment(b.id, payload).subscribe({
      next: (res) => {
        this.toastSvc.success('Paiement enregistré');
        this.selectedBon.set(res.data?.bon ?? res.data ?? null);
        this.closePaymentModal();
        this.loadData();
      },
      error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement')
    });
  }

  closeDetail(): void { this.selectedBon.set(null); }

  printBon(): void {
    const b = this.selectedBon();
    if (!b) return;
    const lines: string[] = [
      '<html>',
      '<head>',
      `<title>Bon de sortie ${b.reference}</title>`,
      '<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd;text-align:left}th{text-transform:uppercase;font-size:12px}</style>',
      '</head>',
      '<body>',
      `<h2>Bon de sortie — ${b.reference}</h2>`,
      `<p>Date: ${new Date(b.date_bon_sor).toLocaleDateString()}<br/>Motif: ${b.motif ?? ''}</p>`,
      '<table>',
      '<thead><tr><th>Produit</th><th>Réf</th><th>Qté</th></tr></thead>',
      '<tbody>',
    ];

    lines.push(...b.lignes.map(l =>
      '<tr><td>' + (l.produit?.nom ?? 'Prod #' + l.produit_id) + '</td>' +
      '<td>' + (l.produit?.reference ?? '') + '</td>' +
      '<td style="text-align:center">' + ((l as any).quantite_sortie_lig_bon_sor ?? (l as any).quantite ?? 0) + '</td></tr>'
    ));

    lines.push(
      '</tbody>',
      '</table>',
      `<h3 style="text-align:right">Total articles: ${b.lignes.length}</h3>`,
      '</body>',
      '</html>',
    );
    const html = lines.join('\n');
    const w = window.open('', '_blank');
    if (!w) { this.toastSvc.error('Impossible d\'ouvrir la fenêtre d\'impression.'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
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
    this.submittedAttempt = true;
    Object.values(this.bonForm.controls).forEach(c => c.markAsTouched());
    this.lignes.controls.forEach(l => Object.values((l as FormGroup).controls).forEach(sc => sc.markAsTouched()));
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
        this.submitting.set(false);
        if (err?.status === 422 && err?.error?.errors) {
          const errors = err.error.errors;
          Object.keys(errors).forEach(key => {
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
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement.');
      }
    });
  }
}
