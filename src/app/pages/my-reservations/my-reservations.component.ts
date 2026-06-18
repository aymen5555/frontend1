import { Component, inject, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-reservations.component.html',
})
export class MyReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  
  reservations: any[] = [];
  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  loading = false;

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getMine().subscribe({
      next: (res: any[]) => {
        this.reservations = res;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  get filteredReservations() {
    if (this.activeTab === 'upcoming') {
      return this.reservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
    } else if (this.activeTab === 'past') {
      return this.reservations.filter(r => r.status === 'played');
    } else {
      return this.reservations.filter(r => r.status === 'cancelled');
    }
  }

  onCancel(id: number): void {
    if (confirm('Voulez-vous vraiment annuler cette réservation ?')) {
      this.reservationService.cancel(id).subscribe({
        next: () => this.loadReservations(),
        error: (err: any) => console.error(err)
      });
    }
  }

  onReschedule(reservation: any): void {
    console.log('Reschedule not implemented for legacy component', reservation.id);
  }

  onPay(id: number): void {
    this.reservationService.pay(id, 'especes').subscribe({
      next: () => this.loadReservations(),
      error: (err: any) => console.error(err)
    });
  }

  onConfirm(id: number): void {
    this.reservationService.confirmCashPayment(id).subscribe({
      next: () => this.loadReservations(),
      error: (err: any) => console.error(err)
    });
  }

  onViewDetails(reservation: any): void {
    this.reservationService.getById(reservation.id).subscribe({
      next: (res: any) => console.log(res),
      error: (err: any) => console.error(err)
    });
  }
}
