import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AbonnementService } from '../../../services/abonnement.service';
import { ComplexeService } from '../../../services/complexe.service';
import { AuthService } from '../../../services/auth.service';
import { TypeAbonnement, AbonnementAdherent } from '../../../models/abonnement-adherent.model';
import { ToastService } from '../../../services/toast.service';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-subscription-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <section class="rounded-[2rem] bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 p-8 text-white shadow-2xl shadow-emerald-200/30 mb-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-emerald-100/80">Gestion des Abonnements</p>
            <h1 class="mt-3 text-4xl font-extrabold">Tableau de bord des abonnements</h1>
            <p class="mt-3 max-w-2xl text-sm text-emerald-100/90">Gérez les formules d'abonnement et suivez les abonnements actifs des clients. Les formules sont les plans que vous proposez ; les abonnements sont les clients qui se sont inscrits.</p>
          </div>
<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <div class="rounded-3xl bg-white/10 p-5 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-colors">
               <p class="text-sm uppercase tracking-[0.3em] text-emerald-100/70">Formules</p>
               <p class="mt-3 text-3xl font-bold">{{ loadingTypes ? '...' : types.length }}</p>
               <p class="mt-2 text-xs text-emerald-100/60">Plans disponibles</p>
             </div>
             <div class="rounded-3xl bg-white/10 p-5 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-colors">
               <p class="text-sm uppercase tracking-[0.3em] text-emerald-100/70">Actifs</p>
               <p class="mt-3 text-3xl font-bold">{{ loadingAbonnements ? '...' : abonnements.length }}</p>
               <p class="mt-2 text-xs text-emerald-100/60">Abonnements actuels</p>
             </div>
             <div *ngIf="!auth.isGerant()" class="rounded-3xl bg-white/10 p-5 backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-colors">
               <p class="text-sm uppercase tracking-[0.3em] text-emerald-100/70">Complexes</p>
               <p class="mt-3 text-3xl font-bold">{{ loadingComplexes ? '...' : complexes.length }}</p>
               <p class="mt-2 text-xs text-emerald-100/60">Lieux</p>
             </div>
           </div>
        </div>
      </section>

      <!-- Tabs -->
      <div class="flex mb-6 gap-2">
        <button
          type="button"
          (click)="activeTab = 'types'"
          [class]="activeTab === 'types' ? 'bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold' : 'bg-white border border-gray-200 px-4 py-2 rounded-lg'"
        >
          📋 Formules ({{ types.length }})
        </button>
        <button
          type="button"
          (click)="activeTab = 'subscriptions'"
          [class]="activeTab === 'subscriptions' ? 'bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold' : 'bg-white border border-gray-200 px-4 py-2 rounded-lg'"
        >
          👥 Abonnements ({{ abonnements.length }})
        </button>
      </div>

      <!-- Types Tab -->
      <div *ngIf="activeTab === 'types'" class="space-y-6">
        <div class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="text-3xl">📋</div>
            <div>
              <h2 class="text-lg font-bold text-emerald-900">Formules d'abonnement</h2>
              <p class="text-sm text-emerald-800 mt-1">Les formules sont les différents plans d'abonnement que vous proposez aux clients. Créez et organisez vos offres ici. Les clients pourront ensuite s'abonner à ces formules.</p>
            </div>
          </div>
        </div>

        <div class="rounded-[2rem] bg-white shadow-xl p-6">
          <div class="mb-6">
            <p class="text-sm uppercase tracking-[0.3em] text-emerald-600">Type d'abonnement</p>
            <h2 class="mt-3 text-2xl font-bold text-gray-900">{{ editingType ? 'Modifier une formule' : "Créer une formule d'abonnement" }}</h2>
            <p class="mt-2 text-sm text-gray-500">Complétez les informations ci-dessous pour créer ou mettre à jour une formule (plan) d'abonnement.</p>
          </div>

          <form [formGroup]="typeForm" (ngSubmit)="onSaveType()" class="grid grid-cols-1 gap-4">
            <div class="grid grid-cols-1 gap-4">
              <div *ngIf="auth.isSuperAdmin()">
                <label class="block text-sm font-semibold mb-1">Complexe *</label>
                <select formControlName="complexe_id" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option value="">Sélectionner un complexe...</option>
                  <option *ngFor="let c of complexes" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-1">Nom *</label>
                <input type="text" formControlName="nom" class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold mb-1">Tarif TND *</label>
                  <input type="number" step="0.01" formControlName="tarif" class="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1">Prix Unitaire TND *</label>
                  <input type="number" step="0.01" formControlName="prix_unitaire" class="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold mb-1">Durée (mois) *</label>
                  <input type="number" formControlName="nb_mois" class="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-1">Niveau sportif *</label>
                  <select formControlName="niveau_sportif_cible" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                    <option value="">Sélectionner...</option>
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="expert">Expert</option>
                    <option value="tous">Tous</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Description</label>
              <textarea formControlName="description" class="w-full border border-gray-300 rounded-md px-3 py-2 resize-y" rows="3"></textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Sport cible</label>
              <input type="text" formControlName="sport_cible" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="ex: Fitness, Tennis..." />
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto" [disabled]="typeForm.invalid || savingType">
                {{ savingType ? 'Enregistrement...' : (editingType ? 'Mettre à jour' : 'Créer') }}
              </button>
              <button
                *ngIf="editingType"
                type="button"
                class="bg-transparent text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-md w-full sm:w-auto"
                (click)="cancelEditType()"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>

        <div class="rounded-[2rem] bg-white shadow-xl p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-3">Formules existantes</h3>
          <p class="text-sm text-gray-500 mb-4">Voici les formules que vous avez créées. Cliquez sur Éditer pour mettre à jour une formule.</p>
          <div *ngIf="loadingTypes" class="flex justify-center py-10">
            <app-loader></app-loader>
          </div>
          <div *ngIf="!loadingTypes && types.length === 0" class="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-center text-sm text-blue-700">
            Aucun type d'abonnement pour le moment.
          </div>
          <div *ngIf="!loadingTypes && types.length > 0" class="space-y-4">
            <div *ngFor="let type of types" class="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="flex items-center gap-3">
                    <h4 class="font-semibold text-gray-900">{{ type.nom }}</h4>
                    <span class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {{ type.active ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">{{ type.description }}</p>
                </div>
                <div class="text-xs text-gray-500">
                  Durée: {{ type.nb_mois }} mois • Niveau: {{ type.niveau_sportif_cible }}
                </div>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-3xl bg-white p-4 border border-gray-200">
                  <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Tarif</p>
                  <p class="mt-2 font-semibold text-gray-900">{{ type.tarif | number:'1.2-2' }} TND</p>
                </div>
                <div class="rounded-3xl bg-white p-4 border border-gray-200">
                  <p class="text-xs uppercase tracking-[0.2em] text-gray-500">Prix unitaire</p>
                  <p class="mt-2 font-semibold text-gray-900">{{ type.prix_unitaire | number:'1.2-2' }} TND</p>
                </div>
              </div>
                <div class="mt-4 flex flex-wrap gap-2 justify-end">
                <button
                  *ngIf="!type.active"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-1 px-3 rounded-md"
                  (click)="activateType(type)"
                  [disabled]="savingType || deletingTypeId === type.id"
                  title="Activer"
                >
                  Activer
                </button>
                <button
                  *ngIf="!type.active"
                  class="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md"
                  (click)="deleteType(type)"
                  [disabled]="deletingTypeId === type.id || savingType || ((type.abonnements_count ?? 0) > 0)"
                  title="Supprimer"
                >
                  Supprimer
                </button>
                <button
                  *ngIf="type.active"
                  class="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md flex items-center gap-2"
                  (click)="deactivateType(type.id)"
                  [disabled]="deletingTypeId === type.id"
                  title="Désactiver"
                >
                  <span>🗑</span>
                  Désactiver
                </button>
                <button
                  class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-1 px-3 rounded-md"
                  (click)="editType(type)"
                  [disabled]="savingType || deletingTypeId === type.id"
                  title="Modifier"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscriptions Tab -->
      <div *ngIf="activeTab === 'subscriptions'" class="space-y-6">
        <div class="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="text-3xl">👥</div>
            <div>
              <h2 class="text-lg font-bold text-blue-900">Abonnements clients</h2>
              <p class="text-sm text-blue-800 mt-1">Voir et gérer tous les abonnements actifs des clients. Ici vous pouvez confirmer les paiements, valider les inscriptions et gérer les abonnements en cours.</p>
            </div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div class="rounded-[2rem] bg-white shadow-xl p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Abonnements Adhérents</h2>
                <p class="text-gray-500 text-sm mt-1">Gérez tous les abonnements clients.</p>
              </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
              <div class="rounded-3xl bg-white p-4 border border-gray-200 text-center">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Total abonnements</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{{ abonnements.length }}</p>
              </div>
              <div class="rounded-3xl bg-white p-4 border border-gray-200 text-center">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Actifs</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{{ stats?.actifs ?? abonnements.filter(a => a.statut === 'actif').length }}</p>
              </div>
              <div class="rounded-3xl bg-white p-4 border border-gray-200 text-center">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-500">En attente paiement</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">{{ stats?.en_attente_paiement ?? pendingPayments.length }}</p>
              </div>
            </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 mb-6">
              <div class="rounded-3xl border border-yellow-100 bg-yellow-50 p-5">
                <p class="text-xs uppercase tracking-[0.3em] text-yellow-700">Paiements en attente</p>
                <p class="mt-3 text-3xl font-bold text-yellow-900">{{ pendingPayments.length }}</p>
                <p class="mt-2 text-sm text-yellow-700">{{ pendingPayments.length === 0 ? 'Aucun paiement en attente' : pendingPayments.length + ' paiement(s) à valider' }}</p>
                <p *ngIf="pendingPayments.length > 0" class="mt-3 text-sm text-yellow-900">Total dû : {{ pendingPaymentTotal | number:'1.2-2' }} TND</p>
              </div>
              <!-- Removed: Visible dans la liste explanation card per UX request -->
            </div>

            <!-- Removed: Formules disponibles block (formules have separate tab) -->

            <div *ngIf="loadingAbonnements" class="flex justify-center py-12">
              <app-loader></app-loader>
            </div>

            <div *ngIf="!loadingAbonnements && abonnements.length === 0" class="rounded-[2rem] border border-blue-100 bg-blue-50 p-10 text-center">
              <div class="text-5xl mb-4">🎫</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun abonnement pour le moment</h3>
              <p class="text-gray-600 mb-4">Les abonnements créés par les clients apparaîtront ici.</p>
              <!-- Removed inline advice box to simplify empty state -->
            </div>

            <div *ngIf="!loadingAbonnements && abonnements.length > 0" class="space-y-4">
              <div *ngFor="let ab of abonnements" class="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all">
                <div class="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <div class="space-y-4">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold">
                        {{ (ab.user?.first_name || 'U').charAt(0).toUpperCase() }}{{ (ab.user?.last_name || 'S').charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900">{{ ab.user?.first_name }} {{ ab.user?.last_name }}</p>
                        <p class="text-xs text-gray-500">{{ ab.user?.email }}</p>
                      </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <div class="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Type</p>
                        <p class="mt-2 font-semibold text-gray-900">{{ ab.type_abonnement?.nom || 'N/A' }}</p>
                      </div>
                      <div class="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Complexe</p>
                        <p class="mt-2 font-semibold text-gray-900">{{ ab.complexe?.name || 'N/A' }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="grid gap-4">
                    <div class="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Statut</p>
                      <span class="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="{
                          'bg-emerald-100 text-emerald-700': ab.statut === 'actif',
                          'bg-yellow-100 text-yellow-700': ab.statut === 'expire',
                          'bg-red-100 text-red-700': ab.statut === 'annule'
                        }"
                      >
                        {{ ab.statut | titlecase }}
                      </span>
                    </div>

                    <div class="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Paiement</p>
                      <span class="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="ab.paye ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                      >
                        {{ ab.paye ? '✓ Payé' : '⚠ Impayé' }}
                      </span>
                    </div>

                    <div class="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Fin</p>
                      <p class="mt-2 font-semibold text-gray-900">{{ ab.date_fin | date: 'dd/MM/yyyy' }}</p>
                      <p class="text-xs text-gray-500 mt-1">
                        <span *ngIf="getDaysRemaining(ab.date_fin) > 0">{{ getDaysRemaining(ab.date_fin) }} jours restants</span>
                        <span *ngIf="getDaysRemaining(ab.date_fin) <= 0" class="text-red-600">Expiré</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    *ngIf="!ab.paye && ab.statut !== 'annule'"
                    class="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-lg text-sm py-2 px-4 w-full sm:w-auto"
                    (click)="openConfirmPaymentModal(ab)"
                  >
                    Confirmer paiement
                  </button>
                  <button
                    *ngIf="ab.statut === 'actif'"
                    class="bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg text-sm py-2 px-4 w-full sm:w-auto"
                    (click)="cancelSubscription(ab.id)"
                    [disabled]="cancelingId === ab.id"
                  >
                    <span *ngIf="cancelingId !== ab.id">Annuler</span>
                    <span *ngIf="cancelingId === ab.id" class="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  </button>
                  <button
                    *ngIf="ab.statut !== 'actif'"
                    class="border border-red-300 text-red-600 text-sm py-2 px-4 rounded-lg w-full sm:w-auto"
                    (click)="deleteSubscription(ab.id)"
                    [disabled]="deletingSubscriptionId === ab.id || cancelingId === ab.id"
                  >
                    <span *ngIf="deletingSubscriptionId !== ab.id">Supprimer</span>
                    <span *ngIf="deletingSubscriptionId === ab.id" class="inline-block w-4 h-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></span>
                  </button>
                  <span *ngIf="ab.paye && ab.statut !== 'actif'" class="text-xs text-gray-500 self-center">Aucune action</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Removed Aide rapide card as requested -->
      </div>

      <!-- Confirm Payment Modal -->
      <div *ngIf="paymentModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="relative w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
          <button
            type="button"
            class="absolute right-4 top-4 text-gray-600 hover:text-gray-800 bg-transparent p-1 rounded-full"
            (click)="closePaymentModal()"
            aria-label="Fermer"
          >
            ✕
          </button>
          <h3 class="font-bold text-lg">Confirmer le paiement</h3>
          <form [formGroup]="paymentForm" (ngSubmit)="confirmPayment()" class="space-y-4 mt-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Montant TND</label>
              <input type="number" step="0.01" formControlName="montant" class="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Modalité</label>
              <select formControlName="modalite_paiement" class="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Sélectionner...</option>
                <option value="especes">Espèces</option>
                <option value="carte">Carte</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Référence (optionnel)</label>
              <input type="text" formControlName="reference" class="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end mt-4">
              <button type="button" class="bg-transparent text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-md w-full sm:w-auto" (click)="closePaymentModal()">Annuler</button>
              <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md w-full sm:w-auto" [disabled]="paymentForm.invalid || confirmingPayment">
                Confirmer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SubscriptionAdminComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly abonnementService = inject(AbonnementService);
  private readonly complexeService = inject(ComplexeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  activeTab: 'types' | 'subscriptions' = 'types';
  types: TypeAbonnement[] = [];
  abonnements: AbonnementAdherent[] = [];
  complexes: any[] = [];
  stats: any = null;

  loadingTypes = true;
  loadingAbonnements = true;
  loadingComplexes = true;
  savingType = false;
  deletingTypeId: number | null = null;
  cancelingId: number | null = null;
  deletingSubscriptionId: number | null = null;
  confirmingPayment = false;
  paymentModalVisible = false;

  editingType: TypeAbonnement | null = null;
  editingMode = false;
  selectedAbonnement: AbonnementAdherent | null = null;

  typeForm: FormGroup;
  paymentForm: FormGroup;
  today = new Date();

  get pendingPayments(): AbonnementAdherent[] {
    return this.abonnements.filter((ab) => !ab.paye);
  }

  get pendingPaymentTotal(): number {
    return this.pendingPayments.reduce((total, ab) => total + (ab.reste_a_payer || 0), 0);
  }

  deleteSubscription(id: number): void {
    if (!confirm('Voulez-vous supprimer définitivement cet abonnement ?')) return;

    this.deletingSubscriptionId = id;
    this.abonnementService.adminDelete(id).subscribe({
      next: () => {
        this.abonnements = this.abonnements.filter((item) => item.id !== id);
        this.toast.success('Abonnement supprimé.');
        this.deletingSubscriptionId = null;
        this.loadStats();
      },
      error: () => {
        this.toast.error('Erreur lors de la suppression de l\'abonnement.');
        this.deletingSubscriptionId = null;
      },
    });
  }

  constructor() {
    this.typeForm = this.fb.group({
      complexe_id: ['', Validators.required],
      nom: ['', Validators.required],
      tarif: ['', Validators.required],
      prix_unitaire: ['', Validators.required],
      nb_mois: ['', Validators.required],
      niveau_sportif_cible: ['tous', Validators.required],
      description: [''],
      sport_cible: [''],
    });

    this.paymentForm = this.fb.group({
      montant: ['', Validators.required],
      modalite_paiement: ['', Validators.required],
      reference: [''],
    });
  }

  ngOnInit(): void {
    this.loadTypes();
    this.loadAbonnements();

    const gerantComplexe = this.auth.user()?.complexe;
    if (gerantComplexe && gerantComplexe.id) {
      this.complexes = [gerantComplexe as any];
      this.loadingComplexes = false;
      this.cdr.markForCheck();
      this.typeForm.patchValue({ complexe_id: gerantComplexe.id });
    } else {
      this.loadComplexes();
    }
    this.loadStats();
  }

  loadComplexes(): void {
    this.loadingComplexes = true;
    this.complexeService.getAll().subscribe({
      next: (complexes) => {
        setTimeout(() => {
          this.complexes = complexes;
          this.loadingComplexes = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.toast.error('Erreur lors du chargement des complexes');
        setTimeout(() => {
          this.loadingComplexes = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  loadTypes(): void {
    this.loadingTypes = true;
    this.abonnementService.adminGetTypes().subscribe({
      next: (types) => {
        // backend now includes abonnements_count; ensure field exists
        setTimeout(() => {
          this.types = (types ?? []).map(t => ({ ...t, abonnements_count: (t as any).abonnements_count ?? 0 }));
          this.loadingTypes = false;
          this.cdr.markForCheck();
        });
      },
      error: (error) => {
        console.error('Error loading types:', error);
        this.types = [];
        this.toast.error('Erreur lors du chargement des types: ' + (error?.error?.message || error?.message || 'Erreur serveur'));
        setTimeout(() => {
          this.loadingTypes = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  loadStats(): void {
    this.abonnementService.adminStats().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.stats = data ?? null;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error('Error loading abonnements stats:', err);
        this.stats = null;
      },
    });
  }

  loadAbonnements(): void {
    this.loadingAbonnements = true;
    this.abonnementService.adminGetAbonnements().subscribe({
      next: (abonnements) => {
        setTimeout(() => {
          this.abonnements = abonnements ?? [];
          console.log('Abonnements loaded:', this.abonnements.length, this.abonnements);
          this.loadingAbonnements = false;
          this.cdr.markForCheck();
          this.loadStats();
        });
      },
      error: (error) => {
        console.error('Error loading abonnements:', error);
        this.abonnements = [];
        this.toast.error('Erreur lors du chargement des abonnements: ' + (error?.error?.message || error?.message || 'Erreur serveur'));
        setTimeout(() => {
          this.loadingAbonnements = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  onSaveType(): void {
    if (!this.typeForm.valid) return;

    this.savingType = true;
    const payload = this.typeForm.value;

    if (this.editingType) {
      this.abonnementService.adminUpdateType(this.editingType.id, payload).subscribe({
        next: () => {
          this.toast.success('Type mis à jour');
          this.loadTypes();
          this.resetTypeForm();
          this.editingType = null;
          this.editingMode = false;
          this.savingType = false;
        },
        error: () => {
          this.toast.error('Erreur lors de la mise à jour');
          this.savingType = false;
        },
      });
    } else {
      this.abonnementService.adminStoreType(payload).subscribe({
        next: () => {
          this.toast.success('Type créé');
          this.loadTypes();
          this.resetTypeForm();
          this.editingMode = false;
          this.savingType = false;
        },
        error: () => {
          this.toast.error('Erreur lors de la création');
          this.savingType = false;
        },
      });
    }
  }

  editType(type: TypeAbonnement): void {
    this.editingType = type;
    this.typeForm.patchValue({
      complexe_id: type.complexe_id,
      nom: type.nom,
      tarif: type.tarif,
      prix_unitaire: type.prix_unitaire,
      nb_mois: type.nb_mois,
      niveau_sportif_cible: type.niveau_sportif_cible,
      description: type.description ?? '',
      sport_cible: type.sport_cible ?? '',
    });
    this.editingMode = true;
  }

  cancelEditType(): void {
    this.editingType = null;
    this.resetTypeForm();
    this.editingMode = false;
  }

  resetTypeForm(): void {
    this.typeForm.reset();
    const gerantComplexe = this.auth.user()?.complexe;
    if (this.auth.isGerant() && gerantComplexe && gerantComplexe.id) {
      this.typeForm.patchValue({ complexe_id: gerantComplexe.id });
    } else {
      this.typeForm.patchValue({ complexe_id: '' });
    }
  }

  deactivateType(id: number): void {
    if (!confirm('Désactiver ce type d\'abonnement ?')) return;
    this.deletingTypeId = id;
    this.abonnementService.adminUpdateType(id, { active: false }).subscribe({
      next: () => {
        this.toast.success('Type désactivé');
        this.loadTypes();
        this.deletingTypeId = null;
      },
      error: () => {
        this.toast.error('Erreur lors de la désactivation');
        this.deletingTypeId = null;
      },
    });
  }


  activateType(type: TypeAbonnement): void {
    const payload = { active: true };
    this.savingType = true;

    this.abonnementService.adminUpdateType(type.id, payload).subscribe({
      next: (updated) => {
        this.toast.success(`Type ${updated.active ? 'activé' : 'désactivé'}`);
        this.loadTypes();
        this.savingType = false;
      },
      error: () => {
        this.toast.error('Erreur lors de la mise à jour du statut');
        this.savingType = false;
      },
    });
  }

  deleteType(type: TypeAbonnement): void {
    if (!confirm(`Supprimer la formule "${type.nom}" ? Cette action est irréversible.`)) return;
    this.deletingTypeId = type.id;
    this.abonnementService.adminDeleteType(type.id).subscribe({
      next: () => {
        this.toast.success('Type supprimé');
        this.loadTypes();
        this.deletingTypeId = null;
        this.loadStats();
      },
      error: (err) => {
        console.error('Error deleting type:', err);
        this.toast.error('Erreur lors de la suppression du type');
        this.deletingTypeId = null;
      }
    });
  }

  openConfirmPaymentModal(ab: AbonnementAdherent): void {
    this.selectedAbonnement = ab;
    this.paymentModalVisible = true;
    this.paymentForm.patchValue({ montant: ab.reste_a_payer ?? 0 });
  }

  closePaymentModal(): void {
    this.paymentModalVisible = false;
    this.selectedAbonnement = null;
    this.paymentForm.reset();
  }

  confirmPayment(): void {
    if (!this.paymentForm.valid || !this.selectedAbonnement) return;

    this.confirmingPayment = true;
    const { montant, modalite_paiement, reference } = this.paymentForm.value;

    this.abonnementService
      .adminConfirmPayment(this.selectedAbonnement.id, {
        montant,
        modalite_paiement,
        reference,
      })
      .subscribe({
        next: (updated) => {
          this.toast.success('Paiement confirmé');
          this.abonnements = this.abonnements.map((item) =>
            item.id === updated.id
              ? { ...item, paye: true, reste_a_payer: 0, statut: updated.statut ?? item.statut }
              : item,
          );
          this.confirmingPayment = false;
          this.closePaymentModal();
          this.loadStats();
        },
        error: () => {
          this.toast.error('Erreur lors de la confirmation');
          this.confirmingPayment = false;
        },
      });
  }

  cancelSubscription(id: number): void {
    if (!confirm('Êtes-vous sûr?')) return;
    this.cancelingId = id;
    this.abonnementService.adminCancel(id).subscribe({
      next: () => {
        this.abonnements = this.abonnements.map((item) =>
          item.id === id ? { ...item, statut: 'annule', paye: item.paye, reste_a_payer: item.reste_a_payer } : item,
        );
        this.toast.success('Abonnement annulé');
        this.cancelingId = null;
        this.loadStats();
      },
      error: () => {
        this.toast.error('Erreur lors de l\'annulation');
        this.cancelingId = null;
      },
    });
  }

  getDaysRemaining(dateEnd: string | Date): number {
    const endDate = new Date(dateEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
