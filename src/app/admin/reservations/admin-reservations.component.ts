import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../components/shared/loader/loader.component';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Réservations</h1>
          <a routerLink="/admin/dashboard" class="text-emerald-600 hover:text-emerald-700 font-medium">← Retour à Mon Complexe</a>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex space-x-8">
            <button [class.border-b-2]="activeTab() === 'upcoming'" [class.border-emerald-500]="activeTab() === 'upcoming'" [class.text-emerald-600]="activeTab() === 'upcoming'" class="py-2 px-1 font-medium text-sm" (click)="activeTab.set('upcoming')">À venir</button>
            <button [class.border-b-2]="activeTab() === 'past'" [class.border-emerald-500]="activeTab() === 'past'" [class.text-emerald-600]="activeTab() === 'past'" class="py-2 px-1 font-medium text-sm text-gray-500" (click)="activeTab.set('past')">Passées</button>
            <button [class.border-b-2]="activeTab() === 'cancelled'" [class.border-emerald-500]="activeTab() === 'cancelled'" [class.text-emerald-600]="activeTab() === 'cancelled'" class="py-2 px-1 font-medium text-sm text-gray-500" (click)="activeTab.set('cancelled')">Annulées</button>
          </nav>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-12">
          <app-loader></app-loader>
        </div>

        <div *ngIf="!loading() && filteredReservations().length === 0" class="text-center py-12 bg-white rounded-lg">
          <p class="text-gray-500 text-lg">Aucune réservation pour le moment.</p>
        </div>

        <!-- Reservations Table -->
        <div *ngIf="!loading() && filteredReservations().length > 0" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terrain</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-505 uppercase tracking-wider">Horaire</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let r of filteredReservations()">
                <td class="px-6 py-4 text-sm">{{ r.user?.first_name }} {{ r.user?.last_name }}</td>
                <td class="px-6 py-4 text-sm">{{ r.terrain?.name }}</td>
                <td class="px-6 py-4 text-sm">{{ r.start_at | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4 text-sm">{{ r.start_at | date:'HH:mm' }} – {{ r.end_at | date:'HH:mm' }}</td>
                <td class="px-6 py-4 text-sm">
                  <span [ngClass]="{
                    'bg-yellow-100 text-yellow-800': r.statut === 'reservee',
                    'bg-green-100 text-green-800': r.statut === 'confirmee',
                    'bg-red-100 text-red-800': r.statut === 'annulee'
                  }" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ statutLabel(r.statut) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span [ngClass]="{'bg-green-100 text-green-800': r.statut_paiement === 'paye', 'bg-orange-100 text-orange-800': r.statut_paiement !== 'paye'}" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ r.statut_paiement === 'paye' ? 'Payé' : 'Non payé' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm space-x-2">
                  <button *ngIf="r.statut_paiement !== 'paye'" (click)="confirmPayment(r)" class="btn-xs success">Confirmer paiement</button>
                  <button *ngIf="r.statut !== 'annulee'" (click)="cancelReservation(r)" class="btn-xs danger">Annuler</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminReservationsComponent {
  private readonly reservationSvc = inject(ReservationService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  reservations = signal<any[]>([]);
  loading = signal(true);
  activeTab = signal<'upcoming' | 'past' | 'cancelled'>('upcoming');

  filteredReservations = computed(() => {
    const now = new Date();
    const list = this.reservations();
    switch (this.activeTab()) {
      case 'upcoming':
        return list.filter(r => new Date(r.start_at) >= now && r.statut !== 'annulee');
      case 'past':
        return list.filter(r => new Date(r.start_at) < now && r.statut !== 'annulee');
      case 'cancelled':
        return list.filter(r => r.statut === 'annulee');
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.reservationSvc.getAll().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les réservations');
        this.loading.set(false);
      },
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

  confirmPayment(r: any): void {
    if (!confirm('Confirmer le paiement ?')) return;
    this.reservationSvc.adminConfirmPayment(r.id).subscribe({
      next: () => {
        this.toast.success('Paiement confirmé');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Erreur'),
    });
  }

  cancelReservation(r: any): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.reservationSvc.adminCancel(r.id).subscribe({
      next: () => {
        this.toast.success('Réservation annulée');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Erreur'),
    });
  }
}