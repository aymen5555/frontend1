import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-historique-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historique-reservations.component.html',
})
export class HistoriqueReservationsComponent implements OnInit {
  private readonly reservationSvc = inject(ReservationService);
  reservations = signal<any[]>([]);
  loading = signal(true);

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
}
