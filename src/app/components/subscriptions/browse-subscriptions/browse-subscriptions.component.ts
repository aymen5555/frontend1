import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AbonnementService } from '../../../services/abonnement.service';
import { ComplexeService } from '../../../services/complexe.service';
import { Complexe } from '../../../models/complexe.model';
import { TypeAbonnement } from '../../../models/abonnement-adherent.model';
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
      <div class="mb-8 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Abonnements</p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">Choisissez une formule adaptée à votre pratique</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-600">Sélectionnez votre complexe puis choisissez la formule qui vous convient le mieux pour profiter de votre sport en toute simplicité.</p>
      </div>

      <div class="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <label for="filter-complexe-select" class="text-sm font-medium text-gray-700">Filtrer par complexe</label>
        <select id="filter-complexe-select" class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm md:w-64" [(ngModel)]="complexeId" (change)="loadTypes()">
          <option [value]="0">Tous les complexes</option>
          <option *ngFor="let c of complexes" [value]="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div *ngIf="loading" class="flex justify-center">
        <app-loader></app-loader>
      </div>

      <div *ngIf="!loading && types.length === 0" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-800 shadow-sm">
        <p class="font-semibold">Aucun abonnement disponible pour le moment.</p>
        <p class="mt-1 text-sm">Essayez un autre complexe ou revenez plus tard.</p>
      </div>

      <div *ngIf="!loading && types.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let type of types" class="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold text-emerald-700">{{ type.nom }}</h2>
              <p *ngIf="type.complexe" class="mt-1 text-sm text-gray-500">🏟️ {{ type.complexe.name }}</p>
            </div>
            <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Populaire</span>
          </div>
          <p *ngIf="type.description" class="mt-3 text-sm text-gray-600">{{ type.description }}</p>

          <div class="mt-4 border-t border-b border-gray-200 py-4">
            <div class="flex justify-between mb-2">
              <span class="font-semibold text-gray-700">Durée</span>
              <span class="text-gray-900">{{ type.nb_mois }} mois</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="font-semibold text-gray-700">Tarif</span>
              <span class="text-lg font-bold text-emerald-600">{{ type.tarif | number:'1.2-2' }} TND</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-700">Niveau</span>
              <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-700">{{ type.niveau_sportif_cible }}</span>
            </div>
          </div>

          <div *ngIf="type.avantages && type.avantages.length > 0" class="mb-4">
            <h3 class="mb-2 font-semibold text-gray-800">Avantages</h3>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li *ngFor="let avantage of type.avantages">{{ avantage }}</li>
            </ul>
          </div>

          <form [formGroup]="subscribeForm" (ngSubmit)="onSubscribe(type)" class="mt-auto space-y-3">
            <div>
              <label for="date-debut-{{type.id}}" class="mb-1 block text-sm font-semibold text-gray-700">Date de début</label>
              <input
                id="date-debut-{{type.id}}"
                type="date"
                formControlName="dateDebut"
                class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm"
                [min]="today"
              />
              <p *ngIf="dateDebutError" class="mt-1 text-xs text-red-600">{{ dateDebutError }}</p>
            </div>

            <div>
              <label for="modalite-select-{{type.id}}" class="mb-1 block text-sm font-semibold text-gray-700">Modalité de paiement</label>
              <select id="modalite-select-{{type.id}}" formControlName="modalitePaiement" class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm">
                <option value="">Choisir...</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte bancaire</option>
              </select>
              <p *ngIf="modalitePaiementError" class="mt-1 text-xs text-red-600">{{ modalitePaiementError }}</p>
            </div>

            <button
              type="submit"
              class="w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-emerald-700"
              [disabled]="subscribeForm.invalid || subscribing"
            >
              <span *ngIf="!subscribing">S'abonner</span>
              <span *ngIf="subscribing">En cours...</span>
            </button>
          </form>
        </div>
      </div>
    </div>

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
  private readonly cdr = inject(ChangeDetectorRef);

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
      this.complexeId = Number(params['complexeId'] || 0);
      this.loadTypes();
    });

    this.complexeService.getAll().subscribe({
      next: (list) => {
        this.complexes = list || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.complexes = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadTypes(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const complexeId = this.complexeId > 0 ? this.complexeId : undefined;
    this.abonnementService.getTypesDisponibles(complexeId).subscribe({
      next: (types) => {
        this.types = types || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (_err) => {
        this.toast.error('Erreur lors du chargement des abonnements');
        this.types = [];
        this.loading = false;
        this.cdr.detectChanges();
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
