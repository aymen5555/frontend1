import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { ComplexeService } from '../../services/complexe.service';
import { RecommandationService } from '../../services/recommandation.service';
import { ActiviteService } from '../../services/activite.service';
import { ProfilFitnessService } from '../../services/profil-fitness.service';
import { AuthService } from '../../services/auth.service';
import { AbonnementService } from '../../services/abonnement.service';
import { TerrainService } from '../../services/terrain.service';
import { Reservation } from '../../models/reservation.model';
import { ReservationActivite } from '../../models/activite.model';
import { Complexe } from '../../models/complexe.model';
import { RecommendationItem } from '../../models/profil-fitness.model';
import { AbonnementAdherent } from '../../models/abonnement-adherent.model';
import { Terrain } from '../../models/terrain.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  reservationSvc = inject(ReservationService);
  activiteSvc = inject(ActiviteService);
  complexeSvc = inject(ComplexeService);
  recommandationSvc = inject(RecommandationService);
  profilFitnessSvc = inject(ProfilFitnessService);
  auth = inject(AuthService);
  router = inject(Router);
  abonnementSvc = inject(AbonnementService);
  terrainSvc = inject(TerrainService);

  upcomingReservations = signal<Reservation[]>([]);
  upcomingActivities = signal<ReservationActivite[]>([]);
  allTerrains = signal<Terrain[]>([]);
  complexes = signal<Complexe[]>([]);
  recommendations = signal<RecommendationItem[]>([]);
  mesAbonnements = signal<AbonnementAdherent[]>([]);
  hasProfile = signal(false);
  loading = signal(true);
  today = new Date();
  showFitnessBanner = signal(true);
  hasFitnessProfile = signal<boolean | null>(null);

  allTerrainsCount = signal(0);
  activitesCount = signal(0);
  reservationsCount = signal(0);
  usersCount = signal(0);

  getActiveSubscription(): AbonnementAdherent | undefined {
    return this.mesAbonnements().find(sub => sub.statut === 'actif');
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.auth.logout();
      return;
    }

    if (this.auth.isGerant()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (this.auth.isSuperAdmin()) {
      this.loadSuperAdminHome();
      return;
    }

    // Load upcoming reservations
    this.reservationSvc.getMine().subscribe({
      next: (res) => this.upcomingReservations.set(res.filter(r => r.status !== 'cancelled').slice(0, 5)),
      error: () => {}
    });

    // Load upcoming activities
    this.activiteSvc.getMesActivites().subscribe({
      next: (res) => {
        const now = new Date();
        this.upcomingActivities.set(res
          .filter(r => r.statut !== 'annulee')
          .filter(r => {
            const start = r.activite?.heure_debut ? new Date(r.date_seance + 'T' + r.activite.heure_debut) : null;
            return start ? start > now : false;
          })
          .slice(0, 5));
      },
      error: () => {}
    });

    // Check if client has a fitness profile
    this.profilFitnessSvc.getMine().subscribe({
      next: (profile) => {
        this.hasFitnessProfile.set(!!profile);
      },
      error: () => {
        this.hasFitnessProfile.set(false);
      }
    });

    // Load subscriptions
    this.abonnementSvc.getMesAbonnements().subscribe({
      next: (subs) => this.mesAbonnements.set(subs),
      error: () => {}
    });

    // Load recommendations
    this.loading.set(true);
    this.recommandationSvc.getMine().subscribe({
      next: (result) => {
        this.hasProfile.set(result.has_profile);
        this.recommendations.set(result.recommendations || []);
        
        if (result.recommendations && result.recommendations.length > 0) {
          const mappedComplexes = result.recommendations
            .map(r => r.complexe)
            .filter((c): c is any => !!c);
          this.complexes.set(mappedComplexes.slice(0, 4));
        } else {
          this.loadPublicComplexes();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadPublicComplexes();
        this.loading.set(false);
      }
    });
  }

  dismissFitnessBanner(): void {
    this.showFitnessBanner.set(false);
  }

  private loadPublicComplexes(): void {
    this.loading.set(true);
    this.complexeSvc.getAll().subscribe({
      next: (res) => {
        this.complexes.set(res.slice(0, 4));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadSuperAdminHome(): void {
    this.loading.set(true);
    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded >= 4) this.loading.set(false);
    };

    this.complexeSvc.getAll().subscribe({
      next: (data) => this.complexes.set(data),
      error: checkDone,
    });

    this.terrainSvc.list().subscribe({
      next: (data) => {
        this.allTerrains.set(data);
        this.allTerrainsCount.set(data.length);
        checkDone();
      },
      error: checkDone,
    });

    this.activiteSvc.getAll().subscribe({
      next: (data) => {
        this.upcomingActivities.set(data as any);
        this.activitesCount.set(data.length);
        checkDone();
      },
      error: checkDone,
    });

    this.reservationSvc.getAll().subscribe({
      next: (data) => {
        this.reservationsCount.set(data.length);
        checkDone();
      },
      error: checkDone,
    });
  }

  getRecommendationForComplexe(complexeId: number): RecommendationItem | undefined {
    return this.recommendations().find(r => r.complexe?.id === complexeId);
  }

  getDaysRemaining(dateEnd: string | Date): number {
    const endDate = new Date(dateEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  deactivateSuperAdminActivity(act: ReservationActivite): void {
    const activityId = act.activite_id || act.activite?.id;
    if (!activityId) return;
    this.activiteSvc.adminUpdate(activityId, { active: false }).subscribe({
      next: () => {
        this.upcomingActivities.update(list =>
          list.map(a => (a.activite_id === activityId ? { ...a, active: false } : a))
        );
      },
      error: (err) => console.error('Erreur lors de la désactivation:', err),
    });
  }
}
