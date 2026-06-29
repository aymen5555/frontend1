import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AbonnementService } from '../../services/abonnement.service';

@Component({
  selector: 'app-historique-abonnements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './historique-abonnements.component.html',
})
export class HistoriqueAbonnementsComponent implements OnInit {
  private readonly abonnementSvc = inject(AbonnementService);
  abonnements = signal<any[]>([]);
  loading = signal(true);

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
}
