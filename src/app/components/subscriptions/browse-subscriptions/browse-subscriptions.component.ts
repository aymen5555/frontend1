import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AbonnementService } from '../../../services/abonnement.service';
import { ComplexeService } from '../../../services/complexe.service';
import { Complexe } from '../../../models/complexe.model';
import { TypeAbonnement, AbonnementAdherent } from '../../../models/abonnement-adherent.model';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { PaymentModalComponent } from '../../payment-modal/payment-modal.component';

@Component({
  selector: 'app-browse-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent, PaymentModalComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Abonnements Disponibles</h1>

      <div class="mb-6 flex gap-4 items-center">
        <label for="filter-complexe-select" class="text-sm font-medium">Filtrer par complexe</label>
        <select id="filter-complexe-select" class="mt-1 w-64 rounded-xl border border-gray-300 px-3 py-2" [(ngModel)]="complexeId" (change)="loadTypes()">
          <option [value]="0">Tous les complexes</option>
          <option *ngFor="let c of complexes" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div *ngIf="loading" class="flex justify-center">
        <app-loader></app-loader>
      </div>

      <div *ngIf="!loading && types.length === 0" class="rounded-lg border border-gray-200 bg-blue-50 p-4 text-blue-800">
        Aucun abonnement disponible pour ce complexe.
      </div>

      <div *ngIf="!loading && types.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let type of types" class="bg-white rounded-lg shadow-lg p-6">
          <!-- Type Header -->
          <h2 class="text-xl font-bold text-blue-600 mb-2">{{ type.nom }}</h2>
          <p *ngIf="type.complexe" class="text-gray-500 text-sm mb-1">🏟️ {{ type.complexe.name }}</p>
          <p *ngIf="type.description" class="text-gray-600 text-sm mb-4">{{ type.description }}</p>

          <!-- Key Info -->
          <div class="border-t border-b border-gray-200 py-4 mb-4">
            <div class="flex justify-between mb-2">
              <span class="font-semibold">Durée:</span>
              <span>{{ type.nb_mois }} mois</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="font-semibold">Tarif:</span>
              <span class="text-lg text-green-600 font-bold">{{ type.tarif | number:'1.2-2' }} TND</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold">Niveau:</span>
              <span class="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm">{{ type.niveau_sportif_cible }}</span>
            </div>
          </div>

          <!-- Avantages -->
          <div *ngIf="type.avantages && type.avantages.length > 0" class="mb-4">
            <h3 class="font-semibold mb-2">Avantages:</h3>
            <ul class="list-disc list-inside text-sm text-gray-700">
              <li *ngFor="let avantage of type.avantages">{{ avantage }}</li>
            </ul>
          </div>

          <!-- Subscribe Form -->
          <form [formGroup]="subscribeForm" (ngSubmit)="onSubscribe(type)" class="space-y-3">
            <div>
              <label for="date-debut-{{type.id}}" class="block text-sm font-semibold mb-1">Date de début</label>
              <input
                id="date-debut-{{type.id}}"
                type="date"
                formControlName="dateDebut"
                class="w-full rounded-xl border border-gray-300 px-3 py-2"
                [min]="today"
              />
              <p *ngIf="dateDebutError" class="text-red-600 text-xs mt-1">{{ dateDebutError }}</p>
            </div>

            <div>
              <label for="modalite-select-{{type.id}}" class="block text-sm font-semibold mb-1">Modalité de paiement</label>
              <select id="modalite-select-{{type.id}}" formControlName="modalitePaiement" class="w-full rounded-xl border border-gray-300 px-3 py-2">
                <option value="">Choisir...</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte bancaire</option>
              </select>
              <p *ngIf="modalitePaiementError" class="text-red-600 text-xs mt-1">{{ modalitePaiementError }}</p>
            </div>

            <button
              type="submit"
              class="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold"
              [disabled]="subscribeForm.invalid || subscribing"
            >
              <span *ngIf="!subscribing">S'abonner</span>
              <span *ngIf="subscribing">En cours...</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <app-payment-modal *ngIf="showPaymentModal()"
                       (paid)="onPaymentModalPaid($event)"
                       (closed)="onPaymentModalCancelled()"></app-payment-modal>
  `,
  styles: []
})
export class BrowseSubscriptionsComponent implements OnInit {
  private readonly abonnementService = inject(AbonnementService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly complexeService = inject(ComplexeService);

  types: TypeAbonnement[] = [];
  loading = true;
  subscribing = false;
  complexeId = 0;
  complexes: Complexe[] = [];
  today = this.getToday();

  subscribeForm: FormGroup;

  showPaymentModal = signal(false);
  pendingSubscription = signal<{type: TypeAbonnement; dateDebut: string} | null>(null);

  constructor() {
    this.subscribeForm = this.fb.group({
      dateDebut: ['', Validators.required],
      modalitePaiement: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.complexeId = params['complexeId'] || 0;
      this.loadTypes();
    });

    this.complexeService.getAll().subscribe({ next: (list) => (this.complexes = list) });
  }

  loadTypes(): void {
    this.loading = true;
    const complexeId = this.complexeId > 0 ? this.complexeId : undefined;
    this.abonnementService.getTypesDisponibles(complexeId).subscribe({
      next: (types) => {
        this.types = types;
        this.loading = false;
      },
      error: (_err) => {
        this.toast.error('Erreur lors du chargement des abonnements');
        this.loading = false;
      },
    });
  }

  onSubscribe(type: TypeAbonnement): void {
    if (!this.subscribeForm.valid) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }

    const { dateDebut, modalitePaiement } = this.subscribeForm.value;

    if (modalitePaiement === 'carte') {
      this.pendingSubscription.set({ type, dateDebut });
      this.showPaymentModal.set(true);
      return;
    }

    this.subscribing = true;
    this.createSubscription(type.id, 'especes', dateDebut);
  }

  private createSubscription(typeId: number, modalitePaiement: 'especes' | 'carte', dateDebut: string, reference?: string): void {
    this.abonnementService.souscrire(typeId, modalitePaiement, dateDebut, reference).subscribe({
      next: (_sub) => {
        this.subscribing = false;
        this.showPaymentModal.set(false);
        this.pendingSubscription.set(null);
        this.toast.success('Abonnement créé avec succès!');
        this.router.navigate(['/abonnements/mes-abonnements']);
      },
      error: (err) => {
        this.subscribing = false;
        this.toast.error(err.error?.message || "Erreur lors de la création de l'abonnement");
      },
    });
  }

  onPaymentModalPaid(token: string): void {
    const pending = this.pendingSubscription();
    if (!pending) return;
    this.subscribing = true;
    this.createSubscription(pending.type.id, 'carte', pending.dateDebut, token);
  }

  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.pendingSubscription.set(null);
    this.toast.warning('Abonnement annulé.');
  }

  get dateDebutError(): string {
    const control = this.subscribeForm.get('dateDebut');
    return control?.hasError('required') && control?.touched ? 'Date requise' : '';
  }

  get modalitePaiementError(): string {
    const control = this.subscribeForm.get('modalitePaiement');
    return control?.hasError('required') && control?.touched ? 'Modalité requise' : '';
  }

  private getToday(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
