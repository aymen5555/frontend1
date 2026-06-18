import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AbonnementService } from '../../../services/abonnement.service';
import { AbonnementAdherent } from '../../../models/abonnement-adherent.model';
import { ToastService } from '../../../services/toast.service';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Mes Abonnements</h1>
        <a routerLink="/abonnements/parcourir" class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">Parcourir les abonnements</a>
      </div>

      <div *ngIf="loading" class="flex justify-center">
        <app-loader></app-loader>
      </div>

      <div *ngIf="!loading && abonnements.length === 0" class="rounded-lg border border-gray-200 bg-blue-50 p-4 text-blue-800">
        Vous n'avez pas encore d'abonnement. <a routerLink="/abonnements/parcourir" class="text-emerald-600 font-medium">Cliquez ici</a> pour en souscrire un.
      </div>

      <div *ngIf="!loading && abonnements.length > 0" class="space-y-4">
        <div *ngFor="let ab of abonnements" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-start">
            <div>
              <h2 class="text-lg font-semibold">{{ ab.type_abonnement?.nom || 'N/A' }}</h2>
              <p class="text-sm text-gray-600">{{ ab.complexe?.name || 'Complexe inconnu' }}</p>
            </div>
            <div class="flex justify-end">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border" [ngClass]="{
                    'bg-emerald-100 text-emerald-800 border-emerald-200': ab.statut === 'actif' && isActif(ab),
                    'bg-yellow-100 text-yellow-800 border-yellow-200': ab.statut === 'expire',
                    'bg-red-100 text-red-800 border-red-200': ab.statut === 'annule'
                  }">
                {{ ab.statut }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-b py-3 my-3">
            <div>
              <span class="font-semibold block">Début</span>
              <span>{{ ab.date_debut | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div>
              <span class="font-semibold block">Fin</span>
              <span>{{ ab.date_fin | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div>
              <span class="font-semibold block">Montant</span>
              <span class="text-green-600 font-bold">{{ ab.montant_apres_remise | currency }}</span>
            </div>
            <div>
              <span class="font-semibold block">Paiement</span>
              <span [ngClass]="ab.paye ? 'text-green-600' : 'text-red-600'">{{ ab.paye ? 'Payé' : 'Non payé' }}</span>
            </div>
          </div>

          <div *ngIf="!ab.paye" class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
            <p class="text-sm font-semibold">Reste à payer: <span class="text-orange-600">{{ ab.reste_a_payer | currency }}</span></p>
          </div>

          <div *ngIf="ab.remise > 0" class="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
            <p class="text-sm"><span class="font-semibold">Remise appliquée:</span> <span class="text-blue-600 font-bold">{{ ab.remise | currency }}</span></p>
          </div>

          <div class="flex justify-end">
            <a [routerLink]="['/abonnements', ab.id]" class="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Détails</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MySubscriptionsComponent implements OnInit {
  private readonly abonnementService = inject(AbonnementService);
  private readonly toast = inject(ToastService);

  abonnements: AbonnementAdherent[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadAbonnements();
  }

  loadAbonnements(): void {
    this.loading = true;
    this.abonnementService.getMesAbonnements().subscribe({
      next: (abonnements) => {
        this.abonnements = abonnements;
        this.loading = false;
      },
      error: (_err) => {
        this.toast.error('Erreur lors du chargement de vos abonnements');
        this.loading = false;
      },
    });
  }

  isActif(ab: AbonnementAdherent): boolean {
    if (ab.statut !== 'actif') return false;
    const dateFin = new Date(ab.date_fin + 'T00:00:00');
    return dateFin >= new Date();
  }
}
