import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-historique-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historique-reservations.component.html',
})
export class HistoriqueReservationsComponent implements OnInit {
  private readonly reservationSvc = inject(ReservationService);
  reservations = signal<any[]>([]);
  loading = signal(true);

  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  filteredReservations = computed(() => {
    let list = this.reservations();
    const from = this.dateFrom();
    const to = this.dateTo();

    const parseDate = (dateStr: string | null | undefined): Date => {
      if (!dateStr) return new Date(NaN);
      return dateStr.length > 10 ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
    };

    if (from) {
      const fromDate = parseDate(from);
      list = list.filter(r => {
        const dateStr = r.start_at || r.date_seance;
        if (!dateStr) return false;
        const d = parseDate(dateStr);
        return d >= fromDate;
      });
    }

    if (to) {
      const toDate = new Date(`${to}T23:59:59`);
      list = list.filter(r => {
        const dateStr = r.start_at || r.date_seance;
        if (!dateStr) return false;
        const d = parseDate(dateStr);
        return d <= toDate;
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Fetch all and filter client-side for non-active states
    this.reservationSvc.getMine().subscribe({
      next: (list) => { this.reservations.set(list.filter(r => ['cancelled','expired','played'].includes(r.status))); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusBadge(status: string): { class: string; label: string } {
    switch (status) {
      case 'played':
        return { class: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Joué' };
      case 'cancelled':
        return { class: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' };
      case 'expired':
        return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Expiré' };
      case 'pending':
        return { class: 'bg-amber-100 text-amber-800 border-amber-200', label: 'En attente' };
      case 'confirmed':
        return { class: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmé' };
      default:
        return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  }

  resetFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}

