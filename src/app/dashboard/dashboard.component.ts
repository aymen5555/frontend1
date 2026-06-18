import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ComplexeService } from '../services/complexe.service';
import { TerrainService } from '../services/terrain.service';
import { ReservationService } from '../services/reservation.service';
import { Complexe } from '../models/complexe.model';
import { Terrain } from '../models/terrain.model';
import { Reservation } from '../models/reservation.model';
import { RecommandationService } from '../services/recommandation.service';
import { RecommendationItem } from '../models/profil-fitness.model';
import { RouterModule } from '@angular/router';
import { PaymentModalComponent } from '../components/payment-modal/payment-modal.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, PaymentModalComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
    readonly auth = inject(AuthService);
    private complexeSvc = inject(ComplexeService);
    private terrainSvc = inject(TerrainService);
    private reservationSvc = inject(ReservationService);
    private fb = inject(FormBuilder);

    complexes = signal<Complexe[]>([]);
    terrains = signal<Terrain[]>([]);
    reservations = signal<Reservation[]>([]);
    recommendations = signal<RecommendationItem[]>([]);
    selectedComplexId = signal<number | null>(null);
    loading = signal(true);
    booking = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    // Payment modal state
    showPaymentModal = signal(false);
    paymentReservationId = signal<number | null>(null);

    bookForm = this.fb.group({
        terrain_id: [null as number | null, Validators.required],
        start_at: ['', Validators.required],
        end_at: ['', Validators.required],
        notes: [''],
    });

    private recommandationSvc = inject(RecommandationService);

    ngOnInit(): void {
        this.reload();
        this.loadRecommendations();
    }

    private loadRecommendations(): void {
        this.recommandationSvc.getMine().subscribe({
            next: (data) => this.recommendations.set(data.recommendations)
        });
    }

    reload(): void {
        this.loading.set(true);
        this.complexeSvc.list().subscribe({
            next: (data) => {
                this.complexes.set(data);
                const first = data[0]?.id ?? null;
                this.selectedComplexId.set(first);
                if (first) this.loadTerrains(first);
                else this.loading.set(false);
                this.loadMyReservations();
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Failed to load complexes.');
            },
        });
    }

    selectComplex(id: number): void {
        this.selectedComplexId.set(id);
        this.loadTerrains(id);
        this.bookForm.patchValue({ terrain_id: null });
    }

    private loadTerrains(complexeId: number): void {
        this.terrainSvc.list(complexeId).subscribe({
            next: (data) => this.terrains.set(data),
            error: (err) => {
                this.errorMessage.set(err.message || 'Failed to load courts.');
                this.loading.set(false);
            },
            complete: () => this.loading.set(false),
        });
    }

    private loadMyReservations(): void {
        this.reservationSvc.list().subscribe({
            next: (data) => this.reservations.set(data),
        });
    }

    submitBooking(): void {
        if (this.bookForm.invalid) return;
        this.booking.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const v = this.bookForm.value;
        this.reservationSvc.create({
            terrain_id: v.terrain_id!,
            start_at: new Date(v.start_at!).toISOString(),
            end_at: new Date(v.end_at!).toISOString(),
            notes: v.notes || undefined,
            modalite_paiement: 'carte',
        }).subscribe({
            next: (_reservation) => {
                this.booking.set(false);
                this.successMessage.set('Réservation créée ! Cliquez sur "Payer maintenant" pour la confirmer.');
                this.bookForm.reset();
                this.loadMyReservations();
            },
            error: (err) => {
                this.booking.set(false);
                this.errorMessage.set(err.message || 'Booking failed.');
            },
        });
    }

    openPaymentModal(reservationId: number): void {
        this.paymentReservationId.set(reservationId);
        this.showPaymentModal.set(true);
    }

    onPaymentModalPaid(token: string): void {
        const id = this.paymentReservationId();
        if (!id) return;
        this.reservationSvc.pay(id, 'carte', token).subscribe({
            next: () => {
                this.showPaymentModal.set(false);
                this.successMessage.set('Paiement effectué avec succès !');
                this.loadMyReservations();
            },
            error: (err) => {
                this.showPaymentModal.set(false);
                this.errorMessage.set(err.message || 'Payment failed.');
            },
        });
    }

    onPaymentModalCancelled(): void {
        this.showPaymentModal.set(false);
    }

    cancelReservation(r: Reservation): void {
        if (!confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
        this.reservationSvc.cancel(r.id).subscribe({
            next: () => {
                this.successMessage.set('Réservation annulée.');
                this.loadMyReservations();
            },
            error: (err) => this.errorMessage.set(err.message || 'Could not cancel.'),
        });
    }

    deleteReservation(r: Reservation): void {
        if (!confirm('Supprimer définitivement cette réservation ?')) return;
        this.reservationSvc.delete(r.id).subscribe({
            next: () => {
                this.successMessage.set('Réservation supprimée.');
                this.loadMyReservations();
            },
            error: (err) => this.errorMessage.set(err.message || 'Could not delete.'),
        });
    }

    canPay(res: Reservation): boolean {
        return res.status === 'pending' && res.statut_paiement === 'non_paye';
    }

    selectedComplexName(): string {
        const id = this.selectedComplexId();
        return this.complexes().find((c) => c.id === id)?.name ?? '';
    }
}
