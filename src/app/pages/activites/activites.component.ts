import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActiviteService } from '../../services/activite.service';
import { AuthService } from '../../services/auth.service';
import { ComplexeService } from '../../services/complexe.service';
import { ToastService } from '../../services/toast.service';
import { Activite, ReservationActivite } from '../../models/activite.model';
import { Complexe } from '../../models/complexe.model';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-activites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaymentModalComponent],
  templateUrl: './activites.component.html',
})
export class ActivitesComponent implements OnInit {
  private readonly activiteSvc = inject(ActiviteService);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly toastSvc    = inject(ToastService);
  readonly auth                = inject(AuthService);
  private readonly router      = inject(Router);

  // Data
  activites   = signal<Activite[]>([]);
  complexes   = signal<Complexe[]>([]);
  loading     = signal(true);

  // Filters
  searchQuery     = signal('');
  filterSport     = signal('');
  filterNiveau    = signal('');
  filterComplexe  = signal('');

  // Booking panel
  showPanel       = signal(false);
  selectedActivite = signal<Activite | null>(null);
  bookingDate     = signal('');
  paymentMethod   = signal<'carte' | 'especes'>('carte');
  bookingInProgress = signal(false);
  bookingSuccess  = signal('');
  bookingError    = signal('');
  placesRestantes = signal<number | null>(null);
  placesLoading   = signal(false);
  userConflict = signal<boolean | null>(null);
  
  // Payment modal state (for card payment)
  showPaymentModal = signal(false);
  paymentReservationId = signal<number | null>(null);

  // Sports list
  sports = [
    { key: 'yoga', label: 'Yoga', emoji: '🧘', color: 'bg-purple-500' },
    { key: 'fitness', label: 'Fitness', emoji: '🏃', color: 'bg-orange-500' },
    { key: 'natation', label: 'Natation', emoji: '🏊', color: 'bg-blue-500' },
    { key: 'musculation', label: 'Musculation', emoji: '🏋️', color: 'bg-gray-700' },
    { key: 'football', label: 'Football', emoji: '⚽', color: 'bg-green-600' },
    { key: 'padel', label: 'Padel', emoji: '🎾', color: 'bg-teal-500' },
    { key: 'tennis', label: 'Tennis', emoji: '🎾', color: 'bg-yellow-500' },
    { key: 'basketball', label: 'Basketball', emoji: '🏀', color: 'bg-orange-600' },
    { key: 'volleyball', label: 'Volleyball', emoji: '🏐', color: 'bg-indigo-500' },
    { key: 'handball', label: 'Handball', emoji: '🤾', color: 'bg-red-500' },
  ];

  niveaux = [
    { key: 'debutant', label: 'Débutant' },
    { key: 'intermediaire', label: 'Intermédiaire' },
    { key: 'expert', label: 'Expert' },
    { key: 'tous', label: 'Tous niveaux' },
  ];

  // Computed filtered list
  filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const s   = this.filterSport();
    const n   = this.filterNiveau();
    const cid = this.filterComplexe();

    return this.activites().filter(a => {
      if (q && !a.nom.toLowerCase().includes(q) && !a.complexe?.name.toLowerCase().includes(q)) return false;
      if (s && a.sport !== s) return false;
      if (n && a.niveau !== n) return false;
      if (cid && String(a.complexe_id) !== cid) return false;
      return true;
    });
  });

  availableDates = computed(() => {
    const act = this.selectedActivite();
    if (!act) return [];
    const dates: { value: string; label: string }[] = [];
    const start = new Date();
    start.setDate(start.getDate() + 1);

    let offset = 0;
    while (dates.length < 21) {
      const d = new Date(start);
      d.setDate(start.getDate() + offset);
      const value = this.toLocalDateInput(d);
      if (this.isDateAllowed(value, act.jours)) {
        dates.push({
          value,
          label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }),
        });
      }
      offset += 1;
    }

    return dates;
  });

  get todayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return this.toLocalDateInput(d);
  }

  private toLocalDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  ngOnInit(): void {
    this.load();
    this.complexeSvc.getAll().subscribe({ next: c => this.complexes.set(c) });
  }

  private load(): void {
    this.loading.set(true);
    this.activiteSvc.getAll().subscribe({
      next: data => { this.activites.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  sportInfo(key: string) {
    return this.sports.find(s => s.key === key) ?? { key, label: key, emoji: '🏃', color: 'bg-emerald-500' };
  }

  niveauBadge(niveau: string): string {
    switch (niveau) {
      case 'debutant':      return 'bg-green-100 text-green-700';
      case 'intermediaire': return 'bg-orange-100 text-orange-700';
      case 'expert':        return 'bg-red-100 text-red-700';
      default:              return 'bg-gray-100 text-gray-600';
    }
  }

  niveauLabel(niveau: string): string {
    return this.niveaux.find(n => n.key === niveau)?.label ?? niveau;
  }

  joursLabel(jours: string[]): string {
    const map: Record<string, string> = {
      lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer',
      jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
    };
    return jours.map(j => map[j] ?? j).join(' · ');
  }

  private parseDate(dateStr: string | null | undefined): Date {
    if (!dateStr) return new Date(NaN);
    return dateStr.length > 10 ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  }

  isDateAllowed(date: string, jours: string[]): boolean {
    if (!date) return false;
    const dayIdx = this.parseDate(date).getDay(); // 0=Sun
    const dayMap: Record<number, string> = {
      0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi',
      4: 'jeudi', 5: 'vendredi', 6: 'samedi',
    };
    return jours.includes(dayMap[dayIdx]);
  }

  openPanel(activite: Activite): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/activites' } });
      return;
    }
    this.selectedActivite.set(activite);
    this.bookingDate.set('');
    this.paymentMethod.set('carte');
    this.bookingSuccess.set('');
    this.bookingError.set('');
    this.placesRestantes.set(null);
    this.placesLoading.set(false);
    this.showPanel.set(true);
  }

  closePanel(): void {
    this.showPanel.set(false);
    this.selectedActivite.set(null);
    this.bookingSuccess.set('');
  }

  setPaymentMethod(m: 'carte' | 'especes'): void {
    this.paymentMethod.set(m);
  }

  onDateChange(): void {
    const act = this.selectedActivite();
    const date = this.bookingDate();
    if (!act || !date || !this.isDateAllowed(date, act.jours)) {
      this.placesRestantes.set(null);
      return;
    }

    this.placesLoading.set(true);
    this.activiteSvc.getPlaces(act.id, date).subscribe({
      next: (data) => {
        this.placesLoading.set(false);
        this.placesRestantes.set(data.places_restantes);
        this.userConflict.set(Boolean(data.user_conflict));
      },
      error: () => {
        this.placesLoading.set(false);
        this.placesRestantes.set(null);
        this.userConflict.set(null);
      },
    });
  }

  confirm(): void {
    const act  = this.selectedActivite();
    const date = this.bookingDate();
    if (!act || !date) return;

    if (!this.isDateAllowed(date, act.jours)) {
      this.bookingError.set(`Cette activité n'a pas lieu ce jour-là. Jours disponibles : ${this.joursLabel(act.jours)}.`);
      return;
    }

    this.bookingInProgress.set(true);
    this.bookingError.set('');

    this.activiteSvc.reserver(act.id, {
      date_seance: date,
      modalite_paiement: this.paymentMethod(),
    }).subscribe({
      next: (reservation: ReservationActivite) => {
        this.bookingInProgress.set(false);
        
        if (this.paymentMethod() === 'carte') {
          // Show payment modal for card payment
          this.paymentReservationId.set(reservation.id);
          this.showPaymentModal.set(true);
        } else {
          // Cash payment - reservation confirmed
          this.showPanel.set(false);
          this.toastSvc.success('Activité réservée avec succès !');
          const formattedDate = this.parseDate(date).toLocaleDateString('fr-FR');
          this.bookingSuccess.set(`Activité réservée ! Rendez-vous le ${formattedDate} à ${act.heure_debut.slice(0,5)}.`);
        }
        this.load();
      },
      error: (err) => {
        this.bookingInProgress.set(false);
        if (err?.status === 409) {
          this.toastSvc.error(err?.error?.message || 'Vous avez déjà réservé cette séance.');
          this.bookingError.set(err?.error?.message || 'Vous avez déjà réservé cette séance.');
        } else {
          this.bookingError.set(err?.error?.message || 'Erreur lors de la réservation.');
        }
      },
    });
  }
  
  getReservationAmountCents(): number | null {
    const act = this.selectedActivite();
    if (!act) return null;
    return Math.round(act.prix * 1000);
  }

  onPaymentModalPaid(paymentIntentId: string): void {
    const id = this.paymentReservationId();
    if (!id) return;
    this.activiteSvc.payReservation(id, paymentIntentId).subscribe({
      next: () => {
        this.showPaymentModal.set(false);
        this.paymentReservationId.set(null);
        this.bookingInProgress.set(false);
        this.showPanel.set(false);
        this.toastSvc.success('Paiement effectué avec succès !');
        this.load();
      },
      error: (err) => {
        this.showPaymentModal.set(false);
        this.paymentReservationId.set(null);
        this.bookingInProgress.set(false);
        this.toastSvc.error(err?.error?.message || 'Erreur lors du paiement.');
      }
    });
  }
  
  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.paymentReservationId.set(null);
    this.bookingInProgress.set(false);
    this.showPanel.set(false);
    this.toastSvc.warning('Paiement non effectué. Votre réservation est conservée en attente de paiement dans Mes Activités.');
    this.load();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.filterSport.set('');
    this.filterNiveau.set('');
    this.filterComplexe.set('');
  }
}