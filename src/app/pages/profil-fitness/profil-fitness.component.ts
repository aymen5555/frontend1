import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfilFitnessService } from '../../services/profil-fitness.service';
import { RecommandationService } from '../../services/recommandation.service';
import { ToastService } from '../../services/toast.service';
import { ProfilFitness, RecommendationItem } from '../../models/profil-fitness.model';

@Component({
  selector: 'app-profil-fitness',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profil-fitness.component.html',
  styles: [`
    :host { display: block; }
  `]
})
export class ProfilFitnessComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profilFitnessSvc = inject(ProfilFitnessService);
  private recommandationSvc = inject(RecommandationService);
  private toastSvc = inject(ToastService);

  isEditing = signal(false);
  submitting = signal(false);
  loading = signal(true);
  loadingRecs = signal(true);

  // Profile data
  savedProfile = signal<ProfilFitness | null>(null);
  imcCategory = signal<string>('');

  // Recommendations
  hasProfile = signal(false);
  recommendations = signal<RecommendationItem[]>([]);

  // IMC display helpers
  imcDisplay = computed(() => {
    const p = this.savedProfile();
    if (!p?.imc) return null;
    return {
      value: p.imc,
      category: this.getImcCategory(p.imc),
    };
  });

  // Sport options for badge grid
  sports = [
    { key: 'football', label: '⚽ Football' },
    { key: 'padel', label: '🎾 Padel' },
    { key: 'natation', label: '🏊 Natation' },
    { key: 'tennis', label: '🎾 Tennis' },
    { key: 'musculation', label: '🏋️ Musculation' },
    { key: 'yoga', label: '🧘 Yoga' },
    { key: 'fitness', label: '🏃 Fitness' },
    { key: 'volleyball', label: '🏐 Volleyball' },
    { key: 'basketball', label: '🏀 Basketball' },
    { key: 'handball', label: '🤾 Handball' },
  ];

  // Objectif sportif cards
  objectifs = [
    { key: 'perte_poids', label: '🏃 Perte de poids' },
    { key: 'prise_masse', label: '💪 Prise de masse' },
    { key: 'performance', label: '🏆 Performance' },
  ];

  // Niveau sportif cards
  niveaux = [
    { key: 'debutant', label: '🌱 Débutant' },
    { key: 'intermediaire', label: '⚡ Intermédiaire' },
    { key: 'expert', label: '🔥 Expert' },
  ];

  fitnessForm = this.fb.group({
    taille: [null as number | null, [Validators.required, Validators.min(100), Validators.max(250), Validators.pattern(/^[0-9]+$/)]],
    poids: [null as number | null, [Validators.required, Validators.min(30), Validators.max(300)]],
    poids_cible: [null as number | null],
    objectif_sportif: ['', Validators.required],
    niveau_sportif: ['', Validators.required],
    sport_prefere: ['', Validators.required],
    budget_mensuel_min: [null as number | null],
    budget_mensuel_max: [null as number | null],
  });

  ngOnInit() {
    this.loadProfile();
    this.loadRecommendations();
  }

  private loadProfile() {
    this.loading.set(true);
    this.profilFitnessSvc.getMine().subscribe({
      next: (data) => {
        if (data) {
          this.isEditing.set(true);
          this.savedProfile.set(data);
          this.fitnessForm.patchValue({
            taille: data.taille,
            poids: data.poids,
            poids_cible: data.poids_cible ?? null,
            objectif_sportif: data.objectif_sportif,
            niveau_sportif: data.niveau_sportif,
            sport_prefere: data.sport_prefere,
            budget_mensuel_min: data.budget_mensuel_min ?? null,
            budget_mensuel_max: data.budget_mensuel_max ?? null,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadRecommendations() {
    this.loadingRecs.set(true);
    this.recommandationSvc.getMine().subscribe({
      next: (result) => {
        this.hasProfile.set(result.has_profile);
        this.recommendations.set(result.recommendations.slice(0, 3));
        this.loadingRecs.set(false);
      },
      error: () => {
        this.loadingRecs.set(false);
      }
    });
  }

  selectSport(sport: string) {
    this.fitnessForm.patchValue({ sport_prefere: sport });
  }

  selectObjectif(key: string) {
    this.fitnessForm.patchValue({ objectif_sportif: key });
  }

  selectNiveau(key: string) {
    this.fitnessForm.patchValue({ niveau_sportif: key });
  }

  saveProfile() {
    if (this.fitnessForm.invalid) return;
    this.submitting.set(true);

    const raw = this.fitnessForm.value as {
      taille: number | null;
      poids: number | null;
      poids_cible: number | null;
      objectif_sportif: string;
      niveau_sportif: string;
      sport_prefere: string;
      budget_mensuel_min: number | null;
      budget_mensuel_max: number | null;
    };

    const payload = {
      taille: parseInt(String(raw.taille), 10),
      poids: Number(raw.poids),
      poids_cible: raw.poids_cible ? Number(raw.poids_cible) : undefined,
      objectif_sportif: raw.objectif_sportif,
      niveau_sportif: raw.niveau_sportif,
      sport_prefere: raw.sport_prefere,
      budget_mensuel_min: raw.budget_mensuel_min ? Number(raw.budget_mensuel_min) : undefined,
      budget_mensuel_max: raw.budget_mensuel_max ? Number(raw.budget_mensuel_max) : undefined,
    };

    const request = this.isEditing()
      ? this.profilFitnessSvc.update(payload)
      : this.profilFitnessSvc.create(payload);

    request.subscribe({
      next: (profile) => {
        this.isEditing.set(true);
        this.savedProfile.set(profile);
        this.submitting.set(false);
        this.toastSvc.success('Profil mis à jour ✓');
        // Reload recommendations after save
        this.loadRecommendations();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement du profil');
      }
    });
  }

  /** Get IMC category label */
  private getImcCategory(imc: number): string {
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Poids normal';
    if (imc < 30) return 'Surpoids';
    return 'Obésité';
  }

  /** Generate rating stars display */
  stars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '⭐';
    if (half) stars += '⭐';
    return stars;
  }
}
