import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AbonnementService } from '../../services/abonnement.service';

@Component({
  selector: 'app-historique-abonnements',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historique-abonnements.component.html',
})
export class HistoriqueAbonnementsComponent implements OnInit {
  private readonly abonnementSvc = inject(AbonnementService);
  abonnements = signal<any[]>([]);
  loading = signal(true);

  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  filteredAbonnements = computed(() => {
    let list = this.abonnements();
    const from = this.dateFrom();
    const to = this.dateTo();

    const parseDate = (dateStr: string | null | undefined): Date => {
      if (!dateStr) return new Date(NaN);
      return dateStr.length > 10 ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
    };

    if (from) {
      const fromDate = parseDate(from);
      list = list.filter(a => {
        if (!a.date_debut) return false;
        const d = parseDate(a.date_debut);
        return d >= fromDate;
      });
    }

    if (to) {
      const toDate = new Date(to + 'T23:59:59');
      list = list.filter(a => {
        if (!a.date_debut) return false;
        const d = new Date(a.date_debut);
        return d <= toDate;
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.abonnementSvc.getMesAbonnements().subscribe({
      next: (list) => { this.abonnements.set(list.filter(a => a.statut !== 'actif')); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statutBadge(statut: string): { class: string; label: string } {
    switch (statut) {
      case 'actif':   return { class: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Actif' };
      case 'expire':  return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Expiré' };
      case 'annule':  return { class: 'bg-red-100 text-red-800 border-red-200', label: 'Annulé' };
      default:        return { class: 'bg-gray-100 text-gray-700 border-gray-200', label: statut };
    }
  }

  resetFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}

