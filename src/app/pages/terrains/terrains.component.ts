import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { TerrainService } from '../../services/terrain.service';
import { ComplexeService } from '../../services/complexe.service';
import { ReservationService } from '../../services/reservation.service';
import { Terrain } from '../../models/terrain.model';
import { Complexe } from '../../models/complexe.model';
import { Slot } from '../../models/slot.model';
import { forkJoin, map, switchMap, tap } from 'rxjs';

interface TerrainWithSlots extends Terrain {
  slots: Slot[];
  image_t?: string;
  description_t?: string;
  capacite_t?: number;
  heure_ouverture?: string;
  heure_fermeture?: string;
  nbheures_seance?: number;
  nbminute_seance?: number;
}

@Component({
  selector: 'app-terrains',
  standalone: true,
  imports: [CommonModule, PaymentModalComponent],
  templateUrl: './terrains.component.html',
  styleUrl: './terrains.component.css',
})
export class TerrainsComponent implements OnInit, OnDestroy {
  private readonly terrainSvc = inject(TerrainService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly reservationSvc = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);

  terrains = signal<TerrainWithSlots[]>([]);
  complexes = signal<Complexe[]>([]);
  loading = signal(true);
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  selectedComplexId = signal<number | null>(null);
  selectedTerrainId = signal<number | null>(null);
  minPrice = signal(0);
  maxPrice = signal(100);
  selectedSportType = signal('all');

  showBookingPanel = signal(false);
  selectedTerrain = signal<TerrainWithSlots | null>(null);
  selectedSlot = signal<Slot | null>(null);
  paymentMethod = signal<'especes' | 'carte'>('carte');
  readonly paymentMethods = ['especes', 'carte'] as const;
  bookingInProgress = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  paymentDeadlineMinutes = signal<number | null>(null);
  paymentDeadlineTimer = signal<number | undefined>(undefined);
  // Payment modal state
  showPaymentModal = signal(false);
  paymentReservationId = signal<number | null>(null);

  filteredTerrains = computed(() => {
    return this.terrains().filter(t => {
      const price = Number.parseFloat(t.price_per_hour.toString());
      const matchesPrice = price >= this.minPrice() && price <= this.maxPrice();
      const matchesSport = this.selectedSportType() === 'all' || t.sport_type === this.selectedSportType();
      return matchesPrice && matchesSport;
    });
  });

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const complexeIdParam = queryParams.get('complexe_id');
    const complexeId = complexeIdParam ? Number(complexeIdParam) : Number.NaN;

    if (!Number.isNaN(complexeId) && complexeId > 0) {
      this.selectedComplexId.set(complexeId);
    }

    const sportParam = queryParams.get('sport');
    if (sportParam) {
      this.selectedSportType.set(sportParam.toLowerCase());
    }

    const terrainIdParam = queryParams.get('terrain_id');
    if (terrainIdParam) {
      const tId = Number(terrainIdParam);
      if (!Number.isNaN(tId) && tId > 0) {
        this.selectedTerrainId.set(tId);
      }
    }

    this.loadComplexes();
    this.loadTerrains();
  }

  ngOnDestroy(): void {
    const timer = this.paymentDeadlineTimer();
    if (timer !== undefined) {
      clearInterval(timer);
    }
  }

  getPaymentDeadlineWarning(): string | null {
    const minutes = this.paymentDeadlineMinutes();
    if (minutes === null) return null;
    if (minutes <= 0) return '⚠️ Your reservation will be cancelled if payment is not completed!';
    if (minutes <= 5) return `⚠️ Payment expires in ${minutes} minute${minutes > 1 ? 's' : ''}!`;
    return null;
  }

  startPaymentDeadlineCountdown(): void {
    const currentTimer = this.paymentDeadlineTimer();
    if (currentTimer !== undefined) clearInterval(currentTimer);
    const startTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    const updateCountdown = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, thirtyMinutes - elapsed);
      const minutesLeft = Math.ceil(remaining / 60000);
      this.paymentDeadlineMinutes.set(minutesLeft);

      if (remaining <= 0) {
        this.paymentDeadlineMinutes.set(null);
        const currentTimer = this.paymentDeadlineTimer();
        if (currentTimer !== undefined) clearInterval(currentTimer);
      }
    };

    const timer = setInterval(updateCountdown, 1000);
    this.paymentDeadlineTimer.set(timer);
    updateCountdown();
  }

  private loadComplexes(): void {
    this.complexeSvc.list().subscribe({
      next: (data) => this.complexes.set(data),
      error: (err) => console.error('Failed to load complexes', err)
    });
  }

  loadTerrains(): void {
    this.loading.set(true);
    const timezone = this.browserTimezone();

    this.terrainSvc.list(this.selectedComplexId() || undefined).pipe(
      tap(data => {
        const initialTerrains = data.map(t => ({ ...t, slots: [] as Slot[] }));
        this.terrains.set(initialTerrains);
      }),
      switchMap(terrains => {
        if (terrains.length === 0) return [[]];
        const slotRequests = terrains.map(t =>
          this.terrainSvc.getSlots(t.id, this.selectedDate(), timezone).pipe(
            map(slots => ({ id: t.id, slots }))
          )
        );
        return forkJoin(slotRequests);
      })
    ).subscribe({
      next: (results) => {
        this.applySlotResults(results);
        this.loading.set(false);
        this.scrollToSelectedTerrain();
      },
      error: (err) => {
        console.error('Failed to load terrains or slots', err);
        this.loading.set(false);
      }
    });
  }

  scrollToSelectedTerrain(): void {
    const terrainId = this.selectedTerrainId();
    if (!terrainId) return;
    setTimeout(() => {
      const element = document.getElementById(`terrain-${terrainId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }

  onComplexChange(): void {
    this.selectedTerrainId.set(null);
    this.loadTerrains();
  }

  private applySlotResults(results: Array<{ id: number; slots: Slot[] }>): void {
    this.terrains.update(current =>
      current.map(t => {
        const slotData = results.find(r => r.id === t.id);
        return slotData ? { ...t, slots: slotData.slots } : t;
      })
    );
  }

  applyFilters(): void {
    this.loadTerrains();
  }

  openBookingPanel(terrain: TerrainWithSlots, slot: Slot): void {
    if (!slot.available) return;
    this.selectedTerrain.set(terrain);
    this.selectedSlot.set(slot);
    this.showBookingPanel.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeBookingPanel(): void {
    this.showBookingPanel.set(false);
    this.selectedTerrain.set(null);
    this.selectedSlot.set(null);
  }

  selectedDateLabel(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
    }).format(new Date(this.selectedDate()));
  }

  browserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  setPaymentMethod(method: 'especes' | 'carte'): void {
    this.paymentMethod.set(method);
  }

  confirmBooking(): void {
    const terrain = this.selectedTerrain();
    const slot = this.selectedSlot();

    if (!terrain || !slot) return;

    this.bookingInProgress.set(true);
    this.errorMessage.set('');

    const startStr = slot.starts_at || `${this.selectedDate()} ${slot.time}:00`;
    const endStr = slot.ends_at || `${this.selectedDate()} ${String(Number(slot.time.split(':')[0]) + 1).padStart(2, '0')}:${slot.time.split(':')[1]}:00`;

    this.reservationSvc.create({
      terrain_id: terrain.id,
      start_at: startStr,
      end_at: endStr,
      notes: undefined,
      modalite_paiement: this.paymentMethod(),
    }).subscribe({
      next: (reservation) => this.handleReservationCreated(reservation),
      error: (err) => this.handleReservationError(err)
    });
  }

  private handleReservationCreated(reservation: { id: number }): void {
    if (this.paymentMethod() === 'especes') {
      this.bookingInProgress.set(false);
      this.successMessage.set('Réservation enregistrée ! Vous pourrez payer sur place.');
      this.paymentDeadlineMinutes.set(null);
      setTimeout(() => {
        this.closeBookingPanel();
        this.loadTerrains();
      }, 1500);
    } else {
      this.startPaymentDeadlineCountdown();
      this.paymentReservationId.set(reservation.id);
      this.showPaymentModal.set(true);
    }
  }

  onPaymentModalCancelled(): void {
    const id = this.paymentReservationId();
    if (id) {
      // Cancel the reservation since user aborted payment
      this.reservationSvc.cancel(id).subscribe({
        next: () => {
          this.showPaymentModal.set(false);
          this.bookingInProgress.set(false);
          this.errorMessage.set('Paiement annulé — réservation annulée.');
          const timerId = this.paymentDeadlineTimer();
          if (timerId !== undefined) clearInterval(timerId);
          this.paymentDeadlineMinutes.set(null);
          setTimeout(() => { this.closeBookingPanel(); this.loadTerrains(); }, 1500);
        },
        error: () => {
          // Retry with force-cancel flag
          this.reservationSvc.cancel(id, true).subscribe({
            next: () => {
              this.showPaymentModal.set(false);
              this.bookingInProgress.set(false);
              this.errorMessage.set('Paiement annulé — réservation annulée.');
              const timerId = this.paymentDeadlineTimer();
              if (timerId !== undefined) clearInterval(timerId);
              this.paymentDeadlineMinutes.set(null);
              setTimeout(() => { this.closeBookingPanel(); this.loadTerrains(); }, 1500);
            },
            error: () => {
              this.showPaymentModal.set(false);
              this.bookingInProgress.set(false);
              this.errorMessage.set('Votre réservation est en attente de paiement. Elle sera automatiquement annulée dans 30 minutes.');
              const timerId = this.paymentDeadlineTimer();
              if (timerId !== undefined) clearInterval(timerId);
              this.paymentDeadlineMinutes.set(null);
              setTimeout(() => { this.closeBookingPanel(); this.loadTerrains(); }, 5000);
            }
          });
        }
      });
    } else {
      this.showPaymentModal.set(false);
      this.bookingInProgress.set(false);
      this.successMessage.set('Réservation créée. Complétez le paiement pour confirmer.');
      setTimeout(() => { this.closeBookingPanel(); this.loadTerrains(); }, 1500);
    }
  }

  onPaymentModalPaid(token: string): void {
    const id = this.paymentReservationId();
    if (!id) return;
    this.reservationSvc.pay(id, 'carte', token).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.handlePaymentSuccess();
      },
      error: (err) => {
        this.showPaymentModal.set(false);
        this.handlePaymentError(err);
      }
    });
  }

  private handlePaymentSuccess(): void {
    this.bookingInProgress.set(false);
    this.paymentDeadlineMinutes.set(null);
    const timerId = this.paymentDeadlineTimer();
    if (timerId !== undefined) clearInterval(timerId);
    this.successMessage.set('Réservation confirmée et payée !');
    setTimeout(() => {
      this.closeBookingPanel();
      this.loadTerrains();
    }, 1500);
  }

  private handlePaymentError(err: { status: number; error?: { message?: string }; message?: string }): void {
    this.bookingInProgress.set(false);
    if (err.status === 401) {
      this.errorMessage.set('Session expirée. Veuillez vous reconnecter.');
    } else if (err.status === 403) {
      this.errorMessage.set('Vous n\'êtes pas autorisé à effectuer cette action.');
    } else {
      this.errorMessage.set('Réservation créée mais le paiement a échoué. Contactez le support.');
    }
  }

  private handleReservationError(err: { status: number; error?: { message?: string; errors?: Record<string, string[]> }; message?: string }): void {
    this.bookingInProgress.set(false);
    if (err.status === 409) {
      this.errorMessage.set('Ce créneau vient d\'être pris. Choisissez-en un autre.');
    } else if (err.error?.errors) {
      const messages = Object.values(err.error.errors).flat().join(' ');
      this.errorMessage.set(messages);
    } else {
      this.errorMessage.set(err.error?.message || err.message || 'Une erreur est survenue');
    }
  }

  getTerrainImage(terrain: TerrainWithSlots): string {
    if (terrain.image_t) return terrain.image_t;
    const sport = (terrain.sport_type || terrain.name || '').toLowerCase();
    if (sport.includes('padel'))
      return 'https://images.unsplash.com/photo-1600198356592-b84a2c7a6b1f?w=600&h=400&fit=crop';
    if (sport.includes('tennis'))
      return 'https://images.unsplash.com/photo-1511047073419-e2b5c45f1abe?w=600&h=400&fit=crop';
    if (sport.includes('football') || sport.includes('foot'))
      return 'https://images.unsplash.com/photo-1519494080482-565cff30e12b?w=600&h=400&fit=crop';
    if (sport.includes('basket'))
      return 'https://images.unsplash.com/photo-1504851117547-41f979a64490?w=600&h=400&fit=crop';
    return 'https://images.unsplash.com/photo-1554445022-41078d8f77fd?w=600&h=400&fit=crop';
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
    this.loadTerrains();
  }

  onPriceChange(event: Event): void {
    this.maxPrice.set(Number.parseInt((event.target as HTMLInputElement).value, 10));
  }

  resetFilters(): void {
    this.selectedDate.set(new Date().toISOString().split('T')[0]);
    this.maxPrice.set(150);
    this.selectedSportType.set('all');
    this.selectedTerrainId.set(null);
    this.loadTerrains();
  }

  getTerrainComplexName(terrain: Terrain): string {
    return terrain.complexe?.name || 'Complexe inconnu';
  }
}
