import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ComplexeService } from '../../services/complexe.service';
import { AuthService } from '../../services/auth.service';
import { TerrainService } from '../../services/terrain.service';
import { ReservationService } from '../../services/reservation.service';
import { ClientService } from '../../services/client.service';
import { ToastService } from '../../services/toast.service';
import { Complexe } from '../../models/complexe.model';
import { Terrain } from '../../models/terrain.model';
import { Reservation } from '../../models/reservation.model';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private complexeSvc = inject(ComplexeService);
  public auth = inject(AuthService);
  private terrainSvc = inject(TerrainService);
  private reservationSvc = inject(ReservationService);
  private clientSvc = inject(ClientService);
  private toastSvc = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<'dashboard' | 'complexes' | 'terrains' | 'reservations' | 'clients'>('dashboard');
  
  complexes = signal<Complexe[]>([]);
  terrains = signal<Terrain[]>([]);
  reservations = signal<Reservation[]>([]);
  clients = signal<Client[]>([]);
  
  loading = signal(true);
  showComplexModal = signal(false);
  showTerrainModal = signal(false);
  editingComplexe = signal<Complexe | null>(null);
  editingTerrain = signal<Terrain | null>(null);

  complexForm = this.fb.group({
    name: ['', [Validators.required]],
    address: ['', Validators.required],
    city: [''],
    phone: [''],
    image_url: [''],
  });

  terrainForm = this.fb.group({
    complexe_id: [null as number | null, Validators.required],
    name: ['', Validators.required],
    sport_type: ['padel'],
    price_per_hour: [45, Validators.required],
    image_url: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.complexeSvc.getAll().subscribe(res => {
      this.complexes.set(res);
      this.loading.set(false);
    });
    this.terrainSvc.list().subscribe(res => this.terrains.set(res));
    this.loadReservations();
    this.loadClients();
  }

  loadReservations(): void {
    this.reservationSvc.getAll().subscribe(res => this.reservations.set(res));
  }

  loadClients(): void {
    this.clientSvc.list().subscribe(res => this.clients.set(res));
  }

  get complexCount(): number { return this.complexes().length; }
  get terrainCount(): number { return this.terrains().length; }
  get reservationCount(): number { return this.reservations().length; }
  get clientCount(): number { return this.clients().length; }

  // ----- Complexes -----
  openComplexModal() {
    this.editingComplexe.set(null);
    this.complexForm.reset();
    this.showComplexModal.set(true);
  }

  openEditComplexe(complexe: Complexe) {
    this.editingComplexe.set(complexe);
    this.complexForm.patchValue({
      name: complexe.name,
      address: complexe.address || '',
      city: complexe.city || '',
      phone: complexe.phone || '',
      image_url: complexe.image_c || complexe.image_url || '',
    });
    this.showComplexModal.set(true);
  }

  closeComplexModal() {
    this.showComplexModal.set(false);
    this.editingComplexe.set(null);
  }

  updateComplexe() {
    if (this.complexForm.invalid) return;
    const formValue = this.complexForm.value;
    const payload: any = {
      name: formValue.name || '',
      address: formValue.address || '',
      city: formValue.city || '',
      phone: formValue.phone || '',
      image_url: formValue.image_url || null,
    };
    const existing = this.editingComplexe();

    if (existing) {
      this.complexeSvc.update(existing.id, payload).subscribe({
        next: () => { this.closeComplexModal(); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la mise à jour.')
      });
    } else {
      this.complexeSvc.create(payload).subscribe({
        next: () => { this.closeComplexModal(); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la création.')
      });
    }
  }

  deleteComplexe(id: number) {
    if (confirm('Voulez-vous supprimer ce complexe ?')) {
      this.complexeSvc.delete(id).subscribe(() => this.loadData());
    }
  }

  // ----- Terrains -----
  openTerrainModal() {
    this.editingTerrain.set(null);
    // Pre-set complexe for gerant users and avoid showing selector in template
    const user = this.auth.currentUser();
    if (this.auth.isGerant() && user?.complexe?.id) {
      this.terrainForm.reset({ complexe_id: user.complexe.id, sport_type: 'padel', price_per_hour: 45 });
    } else {
      this.terrainForm.reset({ complexe_id: null, sport_type: 'padel', price_per_hour: 45 });
    }
    this.showTerrainModal.set(true);
  }

  openEditTerrain(terrain: Terrain) {
    this.editingTerrain.set(terrain);
    this.terrainForm.patchValue({
      complexe_id: terrain.complexe_id,
      name: terrain.name,
      sport_type: terrain.sport_type,
      price_per_hour: Number(terrain.price_per_hour),
      image_url: terrain.image_t || terrain.image_url || '',
    });
    this.showTerrainModal.set(true);
  }

  closeTerrainModal() {
    this.showTerrainModal.set(false);
    this.editingTerrain.set(null);
  }

  updateTerrain() {
    if (this.terrainForm.invalid) return;
    const formValue = this.terrainForm.value;
    const payload: any = {
      complexe_id: formValue.complexe_id || 0,
      name: formValue.name || '',
      sport_type: formValue.sport_type || 'padel',
      price_per_hour: formValue.price_per_hour || 45,
      image_url: formValue.image_url || null,
    };
    const existing = this.editingTerrain();

    if (existing) {
      this.terrainSvc.update(existing.id, payload).subscribe({
        next: () => { this.closeTerrainModal(); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la mise à jour.')
      });
    } else {
      this.terrainSvc.create(payload).subscribe({
        next: () => { this.closeTerrainModal(); this.loadData(); },
        error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la création.')
      });
    }
  }

  deleteTerrain(id: number) {
    if (confirm('Voulez-vous supprimer ce terrain ?')) {
      this.terrainSvc.delete(id).subscribe(() => this.loadData());
    }
  }

  // ----- Reservations -----
  updateReservationStatus(reservation: Reservation, status: 'confirmed' | 'cancelled'): void {
    if (status === 'cancelled') {
      this.reservationSvc.cancel(reservation.id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || err.message || 'Erreur')
      });
    } else {
      // Confirm pending reservation based on payment method
      const method = reservation.modalite_paiement || 'carte';
      if (method === 'carte') {
        this.reservationSvc.pay(reservation.id, 'carte').subscribe({
          next: () => this.loadData(),
          error: (err) => alert(err.error?.message || err.message || 'Erreur')
        });
      } else {
        // Cash payment — use confirm-cash endpoint
        this.reservationSvc.confirmCashPayment(reservation.id).subscribe({
          next: () => this.loadData(),
          error: (err) => alert(err.error?.message || err.message || 'Erreur')
        });
      }
    }
  }

  // ----- Clients -----
  toggleClientActive(client: Client): void {
    this.clientSvc.setActive(client.id, !client.is_active).subscribe({
      next: (updated) => {
        this.clients.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c))
        );
      },
      error: () => {},
    });
  }

  // ----- Helpers -----
  getComplexeName(id?: number | null): string {
    if (!id) return 'Inconnu';
    return this.complexes().find(c => c.id === id)?.name || 'Inconnu';
  }
}
