import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActiviteService } from '../../services/activite.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../components/shared/loader/loader.component';

@Component({
  selector: 'app-admin-activites',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Activités</h1>
          <a routerLink="/admin/dashboard" class="text-emerald-600 hover:text-emerald-700 font-medium">← Retour à Mon Complexe</a>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex space-x-8">
            <button [class.border-b-2]="activeTab() === 'activities'" [class.border-emerald-500]="activeTab() === 'activities'" [class.text-emerald-600]="activeTab() === 'activities'" class="py-2 px-1 font-medium text-sm" (click)="activeTab.set('activities')">Activités</button>
            <button [class.border-b-2]="activeTab() === 'reservations'" [class.border-emerald-500]="activeTab() === 'reservations'" [class.text-emerald-600]="activeTab() === 'reservations'" class="py-2 px-1 font-medium text-sm text-gray-500" (click)="activeTab.set('reservations')">Réservations</button>
          </nav>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-12">
          <app-loader></app-loader>
        </div>

        <!-- Activities Tab -->
        <div *ngIf="!loading() && activeTab() === 'activities'">
          <div *ngIf="activites().length === 0" class="text-center py-12 bg-white rounded-lg">
            <p class="text-gray-500 text-lg">Aucune activité pour le moment.</p>
          </div>

          <div *ngIf="activites().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let act of activites()" class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="font-bold text-lg text-gray-900">{{ act.nom }}</h3>
                <p class="text-sm text-gray-500">{{ act.description }}</p>
                <p class="text-sm text-emerald-600 font-medium mt-2">{{ act.heure_debut | slice:0:5 }} – {{ act.heure_fin | slice:0:5 }}</p>
                <div class="flex gap-2 mt-4">
                  <button (click)="editActivite(act)" class="px-3 py-1 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition">Modifier</button>
                  <button *ngIf="act.active" (click)="deactivateActivite(act)" class="px-3 py-1 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition">Désactiver</button>
                  <button *ngIf="!act.active" (click)="activateActivite(act)" class="px-3 py-1 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition">Activer</button>
                  <button (click)="deleteActivite(act)" class="px-3 py-1 rounded text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition">Supprimer</button>
                </div>
              </div>
          </div>
        </div>

        <!-- Reservations Tab -->
        <div *ngIf="!loading() && activeTab() === 'reservations'">
          <div *ngIf="reservations().length === 0" class="text-center py-12 bg-white rounded-lg">
            <p class="text-gray-500 text-lg">Aucune réservation d'activité pour le moment.</p>
          </div>

          <div *ngIf="reservations().length > 0" class="bg-white rounded-lg shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activité</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let r of reservations()">
                  <td class="px-6 py-4 text-sm">{{ r.user?.first_name }} {{ r.user?.last_name }}</td>
                  <td class="px-6 py-4 text-sm">{{ r.activite?.nom }}</td>
                  <td class="px-6 py-4 text-sm">{{ r.date_seance | date:'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-4 text-sm">
                    <span [ngClass]="{
                      'bg-yellow-100 text-yellow-800': r.statut === 'reservee',
                      'bg-green-100 text-green-800': r.statut === 'confirmee',
                      'bg-red-100 text-red-800': r.statut === 'annulee'
                    }" class="px-2 py-1 rounded-full text-xs font-medium">
                      {{ statutLabel(r.statut) }}
                    </span>
                    <span *ngIf="r.refund_status === 'pending'" class="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Remboursement en attente
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="flex gap-2">
                      <button *ngIf="r.refund_status === 'pending'" (click)="confirmRefundReservation(r)" class="px-3 py-1 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition">Confirmer remboursement</button>
                      <button *ngIf="r.statut !== 'annulee'" (click)="cancelReservation(r)" class="px-3 py-1 rounded text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition">Annuler</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminActivitesComponent {
  private readonly activiteSvc = inject(ActiviteService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  activites = signal<any[]>([]);
  reservations = signal<any[]>([]);
  loading = signal(true);
  activeTab = signal<'activities' | 'reservations'>('activities');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.activiteSvc.adminGetAll().subscribe({
      next: (data) => {
        this.activites.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les activités');
        this.loading.set(false);
      },
    });
    this.activiteSvc.adminGetReservations().subscribe({
      next: (data) => this.reservations.set(data),
    });
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'reservee': return 'Réservée';
      case 'confirmee': return 'Confirmée';
      case 'annulee': return 'Annulée';
      default: return statut;
    }
  }

  editActivite(act: any): void {
    this.toast.warning('Fonctionnalité à implémenter');
  }

  deactivateActivite(act: any): void {
    this.activiteSvc.adminUpdate(act.id, { active: false }).subscribe({
      next: () => {
        this.toast.success('Activité désactivée');
        this.load();
      },
      error: () => this.toast.error('Erreur'),
    });
  }

  activateActivite(act: any): void {
    this.activiteSvc.adminUpdate(act.id, { active: true }).subscribe({
      next: () => {
        this.toast.success('Activité activée');
        this.load();
      },
      error: () => this.toast.error('Erreur'),
    });
  }

  deleteActivite(act: any): void {
    if (!confirm('Supprimer cette activité ?')) return;
    this.activiteSvc.adminDelete(act.id).subscribe({
      next: () => {
        this.toast.success('Activité supprimée');
        this.load();
      },
      error: () => this.toast.error('Erreur'),
    });
  }

  cancelReservation(r: any): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.activiteSvc.adminCancelReservation(r.id).subscribe({
      next: () => {
        this.toast.success('Réservation annulée');
        this.load();
      },
      error: () => this.toast.error('Erreur'),
    });
  }

  confirmRefundReservation(r: any): void {
    if (!confirm(`Confirmer le remboursement pour ${r.user?.first_name ?? ''} ${r.user?.last_name ?? ''} ?`)) return;
    this.activiteSvc.adminConfirmRefund(r.id).subscribe({
      next: () => {
        this.toast.success('Remboursement confirmé');
        this.load();
      },
      error: () => this.toast.error('Erreur lors de la confirmation du remboursement'),
    });
  }
}