import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplexeService } from '../../services/complexe.service';
import { Complexe } from '../../models/complexe.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-complexes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './complexes-list.component.html',
  styleUrls: []
})
export class ComplexesListComponent implements OnInit {
  complexes = signal<Complexe[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  displayCount = 6;

  filteredComplexes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.complexes();
    return this.complexes().filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.address?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
    );
  });

  visibleComplexes = computed(() => {
    return this.filteredComplexes().slice(0, this.displayCount);
  });

  loadMore(): void {
    this.displayCount += 6;
  }

  get hasMore(): boolean {
    return this.displayCount < this.filteredComplexes().length;
  }

  private router = inject(Router);
  private auth = inject(AuthService);
  constructor(private complexeService: ComplexeService) {}

  ngOnInit() {
    this.complexeService.getAll().subscribe(data => {
      this.complexes.set(data);
      this.loading.set(false);
    });
  }

  getComplexeImage(complexe: Complexe): string {
    if (complexe.image_url) return complexe.image_url;
    if (complexe.image_c) return complexe.image_c;
    const terrains = complexe.terrains || [];
    let sport = '';
    if (terrains.length > 0) {
      sport = (terrains[0].sport_type as string | undefined)?.toLowerCase() || '';
    }
    const label = (complexe.name || '').toLowerCase();
    if (label.includes('padel') || sport.includes('padel'))
      return 'https://images.pexels.com/photos/32474981/pexels-photo-32474981.jpeg';
    if (label.includes('tennis') || sport.includes('tennis'))
      return 'https://images.pexels.com/photos/1784798/pexels-photo-1784798.jpeg';
    if (label.includes('football') || label.includes('foot') || sport.includes('football') || sport.includes('foot'))
      return 'https://images.pexels.com/photos/61135/pexels-photo-61135.jpeg';
    if (label.includes('basket') || sport.includes('basket'))
      return 'https://images.pexels.com/photos/35248286/pexels-photo-35248286.jpeg';
    return 'https://images.pexels.com/photos/32897040/pexels-photo-32897040.jpeg';
  }

  getTerrainCount(complexe: Complexe): number {
    const meta = complexe as unknown as { terrains_count?: number };
    return meta.terrains_count ?? complexe.terrains?.length ?? 0;
  }

  onBook(complexeId: number, event: Event): void {
    event.preventDefault();
    // If guest, redirect to login with redirect param
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/terrains' } });
      return;
    }

    // Logged in users proceed to terrains with selected complexe filter
    this.router.navigate(['/terrains'], { queryParams: { complexe: complexeId } });
  }

  /** Returns array of 5 star types for a given rating (0-5) */
  getStars(rating: number | null | undefined): ('full' | 'half' | 'empty')[] {
    if (!rating) return ['empty', 'empty', 'empty', 'empty', 'empty'];
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }
}
