import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComplexeService } from '../../services/complexe.service';
import { TerrainService } from '../../services/terrain.service';
import { Complexe } from '../../models/complexe.model';
import { Terrain } from '../../models/terrain.model';
import { AuthService } from '../../services/auth.service';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../services/toast.service';
import { TypeAbonnement, AbonnementAdherent } from '../../models/abonnement-adherent.model';
import { ReviewService, Review } from '../../services/review.service';
import { StarRatingComponent } from '../../components/shared/star-rating/star-rating.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-complexe-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentModalComponent, StarRatingComponent, FormsModule],
  templateUrl: './complexe-profile.component.html',
  styleUrl: './complexe-profile.component.css'
})
export class ComplexeProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly complexeSvc = inject(ComplexeService);
  private readonly terrainSvc = inject(TerrainService);
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  private readonly abonnementSvc = inject(AbonnementService);
  private readonly toastSvc = inject(ToastService);
  showPaymentModal = signal(false);

  complexe = signal<Complexe | null>(null);
  terrains = signal<Terrain[]>([]);
  loading = signal(true);

  // Reviews features
  private readonly reviewSvc = inject(ReviewService);
  reviews = signal<Review[]>([]);
  isEligible = signal(false);
  alreadyRated = signal(false);
  newRating = signal(0);
  newCommentaire = '';
  submittingReview = signal(false);


  // Subscription features
  subscriptionTypes = signal<TypeAbonnement[]>([]);
  activeSubscription = signal<AbonnementAdherent | null>(null);
  showSubModal = signal(false);
  selectedType = signal<TypeAbonnement | null>(null);
  modalitePaiement = signal<'especes' | 'carte'>('carte');
  dateDebut = signal(new Date().toISOString().split('T')[0]);
  todayStr = new Date().toISOString().split('T')[0];
  submitting = signal(false);

  private pendingSubscribeTypeId: number | null = null;
  private hasProcessedSubscribeIntent = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['subscribeTypeId']) {
        this.pendingSubscribeTypeId = Number(params['subscribeTypeId']);
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number.parseInt(idParam, 10);
      this.complexeSvc.getById(id).subscribe({
        next: (c) => {
          this.complexe.set(c);
          // Fetch terrains
          this.terrainSvc.list(id).subscribe(terrains => {
            this.terrains.set(terrains);
            this.loading.set(false);
          });
          // Fetch subscription types
          this.abonnementSvc.getTypesDisponibles(id).subscribe({
            next: (types) => {
              this.subscriptionTypes.set(types);
              this.tryOpenPendingSubscription();
            },
            error: () => console.error('Error fetching subscription types')
          });
          // Fetch active subscription if logged in
          this.checkSubscriptionStatus(id);
          // Fetch reviews and eligibility
          this.loadReviews(id);
          this.checkEligibility(id);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }
  }

  checkSubscriptionStatus(complexeId: number): void {
    if (this.auth.isLoggedIn()) {
      this.abonnementSvc.getMesAbonnements().subscribe({
        next: (abonnements) => {
          const activeSub = abonnements.find(ab => ab.complexe_id === complexeId && ab.statut === 'actif');
          this.activeSubscription.set(activeSub || null);
        },
        error: () => console.error('Error fetching user subscriptions')
      });
    }
  }

  getSportIcon(sport: string): string {
    const s = sport.toLowerCase();
    if (s.includes('padel')) return '🎾';
    if (s.includes('tennis')) return '🏸';
    if (s.includes('foot')) return '⚽';
    return '🏃';
  }

  onBook(complexeId: number, terrainId: number, sport: string, event: Event): void {
    event.preventDefault();
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/terrains' } });
      return;
    }
    this.router.navigate(['/terrains'], { queryParams: { complexe_id: complexeId, terrain_id: terrainId, sport } });
  }

  openSubModal(type: TypeAbonnement): void {
    if (!this.auth.isLoggedIn()) {
      const redirectUrl = `${this.router.url}${this.router.url.includes('?') ? '&' : '?'}subscribeTypeId=${type.id}`;
      this.router.navigate(['/auth/login'], { queryParams: { redirect: redirectUrl } });
      return;
    }
    this.showSubscriptionModal(type);
  }

  private showSubscriptionModal(type: TypeAbonnement): void {
    this.selectedType.set(type);
    this.modalitePaiement.set('carte');
    this.dateDebut.set(new Date().toISOString().split('T')[0]);
    this.showSubModal.set(true);
  }

  private tryOpenPendingSubscription(): void {
    if (this.hasProcessedSubscribeIntent || !this.pendingSubscribeTypeId || !this.auth.isLoggedIn()) {
      return;
    }
    const type = this.subscriptionTypes().find(t => t.id === this.pendingSubscribeTypeId);
    if (!type) {
      return;
    }
    this.hasProcessedSubscribeIntent = true;
    this.showSubscriptionModal(type);
    this.clearSubscribeIntentFromUrl();
  }

  private clearSubscribeIntentFromUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { subscribeTypeId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeSubModal(): void {
    this.showSubModal.set(false);
    this.selectedType.set(null);
  }

  onModaliteChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'especes' | 'carte';
    this.modalitePaiement.set(val);
  }

  onDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.dateDebut.set(val);
  }

  confirmSubscription(): void {
    const type = this.selectedType();
    if (!type || this.submitting()) return;

    if (this.modalitePaiement() === 'especes') {
      this.submitting.set(true);
      this.abonnementSvc.souscrire(type.id, 'especes', this.dateDebut()).subscribe({
        next: (sub) => {
          this.submitting.set(false);
          this.closeSubModal();
          this.toastSvc.success(`Abonnement "${type.nom}" souscrit avec succès !`);
          this.activeSubscription.set(sub);
          this.router.navigate(['/mes-abonnements']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.toastSvc.error(err.error?.message || 'Erreur lors de la souscription.');
        }
      });
      return;
    }

    // For card payments, show payment modal first, then create the subscription on success
    this.showPaymentModal.set(true);
  }

  onPaymentModalCancelled(): void {
    this.showPaymentModal.set(false);
    this.toastSvc.error('Paiement annulé. Abonnement non créé.');
  }

  onPaymentModalPaid(token: string): void {
    const type = this.selectedType();
    if (!type) return;
    this.submitting.set(true);
    this.abonnementSvc.souscrire(type.id, 'carte', this.dateDebut(), token).subscribe({
      next: (sub) => {
        this.submitting.set(false);
        this.showPaymentModal.set(false);
        this.closeSubModal();
        this.toastSvc.success(`Abonnement "${type.nom}" souscrit avec succès !`);
        this.activeSubscription.set(sub);
        this.router.navigate(['/mes-abonnements']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.showPaymentModal.set(false);
        this.toastSvc.error(err.error?.message || 'Erreur lors de la souscription.');
      }
    });
  }

  loadReviews(id: number): void {
    this.reviewSvc.getComplexReviews(id).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => console.error('Error fetching complex reviews')
    });
  }

  checkEligibility(id: number): void {
    if (this.auth.isLoggedIn()) {
      this.reviewSvc.getEligibility({ complexe_id: id }).subscribe({
        next: (res) => {
          this.isEligible.set(res.eligible);
          this.alreadyRated.set(res.already_rated);
        },
        error: () => console.error('Error checking rating eligibility')
      });
    }
  }

  submitReview(): void {
    const rating = this.newRating();
    if (rating < 1 || rating > 5 || this.submittingReview()) return;
    this.submittingReview.set(true);
    const id = this.complexe()?.id;
    if (!id) return;
    this.reviewSvc.submitComplexReview(id, rating, this.newCommentaire).subscribe({
      next: () => {
        this.toastSvc.success('Votre avis a été enregistré.');
        this.newRating.set(0);
        this.newCommentaire = '';
        this.submittingReview.set(false);
        this.loadReviews(id);
        this.checkEligibility(id);
      },
      error: (err) => {
        this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'enregistrement de votre avis');
        this.submittingReview.set(false);
      }
    });
  }

  deleteReview(reviewId: number): void {
    if (confirm('Voulez-vous supprimer cet avis ?')) {
      this.reviewSvc.deleteComplexReview(reviewId).subscribe({
        next: () => {
          this.toastSvc.success('Avis supprimé.');
          const id = this.complexe()?.id;
          if (id) {
            this.loadReviews(id);
            this.checkEligibility(id);
          }
        },
        error: () => this.toastSvc.error('Erreur lors de la suppression de l\'avis.')
      });
    }
  }
}
