import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../../components/shared/star-rating/star-rating.component';
import { ComplexeService } from '../../services/complexe.service';
import { Complexe } from '../../models/complexe.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-complexes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StarRatingComponent],
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
      return 'https://images.unsplash.com/photo-1600198356592-b84a2c7a6b1f?w=800&h=600&fit=crop';
    if (label.includes('tennis') || sport.includes('tennis'))
      return 'https://images.unsplash.com/photo-1511047073419-e2b5c45f1abe?w=800&h=600&fit=crop';
    if (label.includes('football') || label.includes('foot') || sport.includes('football') || sport.includes('foot'))
      return 'https://images.unsplash.com/photo-1519494080482-565cff30e12b?w=800&h=600&fit=crop';
    if (label.includes('basket') || sport.includes('basket'))
      return 'https://images.unsplash.com/photo-1504851117547-41f979a64490?w=800&h=600&fit=crop';
    return 'https://images.unsplash.com/photo-1551958219-acbc608c7794?w=800&h=600&fit=crop';
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
}
