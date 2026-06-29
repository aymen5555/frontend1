import { Component, inject, OnInit, signal, AfterViewInit, effect } from '@angular/core';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ComplexeService } from '../../services/complexe.service';
import { TerrainService } from '../../services/terrain.service';
import { ReservationService } from '../../services/reservation.service';
import { ActiviteService } from '../../services/activite.service';
import { ClientService } from '../../services/client.service';
import { ToastService } from '../../services/toast.service';
import { AbonnementService } from '../../services/abonnement.service';
import { GerantService, Gerant, CreateGerantPayload } from '../../services/gerant.service';
import { SocieteService } from '../../services/societe.service';
import { DepenseService } from '../../services/depense.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { SaleService } from '../../services/sale.service';
import { Complexe } from '../../models/complexe.model';
import { Terrain } from '../../models/terrain.model';
import { Reservation } from '../../models/reservation.model';
import { Activite, ReservationActivite } from '../../models/activite.model';
import { Client } from '../../models/client.model';
import { Slot } from '../../models/slot.model';
import { TypeAbonnement, AbonnementAdherent } from '../../models/abonnement-adherent.model';
import { ImageUploadComponent } from '../../components/shared/image-upload/image-upload.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageUploadComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
    readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly complexeSvc = inject(ComplexeService);
    private readonly terrainSvc = inject(TerrainService);
    private readonly reservationSvc = inject(ReservationService);
    private readonly activiteSvc = inject(ActiviteService);
    private readonly clientSvc = inject(ClientService);
    private readonly toastSvc = inject(ToastService);
    private readonly abonnementSvc = inject(AbonnementService);
    private readonly gerantSvc = inject(GerantService);
    private readonly societeSvc = inject(SocieteService);
    private readonly depenseSvc = inject(DepenseService);
    private readonly categorySvc = inject(CategoryService);
    private readonly fb = inject(FormBuilder);
    private readonly productSvc = inject(ProductService);
    private readonly orderSvc = inject(OrderService);
    private readonly saleSvc = inject(SaleService);

    totalProducts = signal<number>(0);
    lowStockProducts = signal<number>(0);
    ordersToday = signal<number>(0);
    directSalesToday = signal<number>(0);
    depensesMois = signal<number>(0);
    nbDepensesMois = signal<number>(0);
    depensesParType = signal<{ designation: string; total: number; count: number }[]>([]);

    complexes = signal<Complexe[]>([]);
    terrains = signal<Terrain[]>([]);
    allTerrains = signal<Terrain[]>([]);
    reservations = signal<Reservation[]>([]);
    activites = signal<Activite[]>([]);
    activiteReservations = signal<ReservationActivite[]>([]);
    clients = signal<Client[]>([]);
    availableSlots = signal<Slot[]>([]);
    selectedComplexId = signal<number | null>(null);
    loading = signal(true);
    errorMessage = signal('');
    showComplexForm = signal(false);
    showTerrainForm = signal(false);
    showManualForm = signal(false);
    showEspecesModal = signal(false);
    showActiviteForm = signal(false);
    showActivitePaymentModal = signal(false);
    submittingManual = signal(false);
    submittingActivite = signal(false);
    editingActivite = signal<Activite | null>(null);
    selectedActiviteReservationForPayment = signal<ReservationActivite | null>(null);
    slotsLoading = signal(false);
    selectedForEspeces = signal<Reservation | null>(null);

    // Subscription management properties
    subscriptionTypes = signal<TypeAbonnement[]>([]);
    clientSubscriptions = signal<AbonnementAdherent[]>([]);
    showTypeForm = signal(false);
    editingType = signal<TypeAbonnement | null>(null);
    submittingType = signal(false);
    showConfirmPaymentModal = signal(false);
    selectedSubForPayment = signal<AbonnementAdherent | null>(null);

    gerantComplexeId = signal<number | null>(null);
    editingComplex = signal<Complexe | null>(null);
    galleryImages = signal<string[]>([]);
    editingTerrain = signal<Terrain | null>(null);
    editingReservation = signal<Reservation | null>(null);
    showEditReservationForm = signal(false);
    submittingComplex = signal(false);
    submittingTerrain = signal(false);
    submittingReservationEdit = signal(false);

    // Gerant management
    gerants = signal<Gerant[]>([]);
    unassignedComplexes = signal<Complexe[]>([]);
    showGerantForm = signal(false);
    submittingGerant = signal(false);
    gerantError = signal('');

    // Assign complexe to gerant modal
    showAssignGerantModal = signal(false);
    selectedGerantForAssign = signal<Gerant | null>(null);
    categoriesRessource = signal<any[]>([]);
    availableComplexesForAssign = signal<Complexe[]>([]);
    selectedAssignComplexeId = signal<number | null>(null);
    societes = signal<any[]>([]);
    submittingAssignComplexe = signal(false);
    assignComplexeError = signal('');

    // Search signals for filtering
    searchClients = signal('');
    searchReservations = signal('');
    searchActivites = signal('');
    searchGerants = signal('');
    searchTypes = signal('');
    selectedComplexeFilter = signal<string>('');
    searchActiviteReservations = '';

    complexForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        address: ['', Validators.required],
        city: [''],
        phone: [''],
        description: [''],
        image_url: [''],
        facebook_url: [''],
        instagram_url: [''],
        website_url: [''],
        gallery_images: this.fb.control<string[]>([]),
        societe_id: [null as number | null],
    });

    terrainForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        sport_type: ['padel'],
        price_per_hour: [45, [Validators.required, Validators.min(0)]],
        image_url: [''],
        categorie_ressource_id: [null as number | null],
    });

    editReservationForm = this.fb.group({
        status: [''],
        statut_paiement: [''],
        modalite_paiement: [''],
        notes: [''],
    });

    manualForm = this.fb.group({
        client_id: [null as number | null, Validators.required],
        terrain_id: [null as number | null, Validators.required],
        date_seance_res: ['', Validators.required],
        heure_debut_res: ['', Validators.required],
        heure_fin_res: ['', Validators.required],
        modalite_paiement: ['especes', Validators.required],
        notes: [''],
    });

    activiteForm = this.fb.group({
        complexe_id: [this.isGerant() ? this.gerantComplexeId() : '', Validators.required],
        nom: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        sport: ['yoga', Validators.required],
        niveau: ['tous', Validators.required],
        capacite: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
        prix: [45, [Validators.required, Validators.min(0)]],
        heure_debut: ['', Validators.required],
        heure_fin: ['', Validators.required],
        jours: [[] as string[], Validators.required],
        image: [''],
    });

    typeForm = this.fb.group({
        complexe_id: [null as number | null, Validators.required],
        nom: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        nb_mois: [1, [Validators.required, Validators.min(1)]],
        tarif: [0, [Validators.required, Validators.min(0)]],
        prix_unitaire: [0, [Validators.required, Validators.min(0)]],
        niveau_sportif_cible: ['tous', Validators.required],
        sport_cible: [''],
        avantages: [''],
    });

    gerantForm = this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        complexe_id: [null as number | null, Validators.required],
        phone: [''],
        company_name: [''],
    });

    confirmPaymentForm = this.fb.group({
        modalite_paiement: ['especes', Validators.required],
        reference: [''],
        montant: [0, [Validators.required, Validators.min(0)]],
    });

    get todayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    constructor() {
        // Reactively scroll to the URL fragment whenever loading transitions to false
        // (i.e. when all async data has arrived and sections have rendered in the DOM)
        effect(() => {
            if (!this.loading()) {
                this.scrollToCurrentFragment();
            }
        });
    }

    ngAfterViewInit(): void {
        // Also try once immediately in case data was already loaded synchronously
        this.scrollToCurrentFragment();
    }

    // ──────────────────────────────────────────────
    // GERANT MANAGEMENT
    // ──────────────────────────────────────────────

    private loadGerants(): void {
        this.gerantSvc.list().subscribe({
            next: (data) => {
                this.gerants.set(data);
                this.updateUnassignedComplexes();
            },
            error: () => {},
        });
    }

    private updateUnassignedComplexes(): void {
        const assignedIds = new Set(this.gerants().map(g => g.complexe?.id).filter(Boolean));
        const unassigned = this.complexes().filter(c => !assignedIds.has(c.id));
        this.unassignedComplexes.set(unassigned);
    }

    openGerantForm(): void {
        this.gerantForm.reset({ complexe_id: null });
        this.gerantError.set('');
        this.showGerantForm.set(true);
    }

    closeGerantForm(): void {
        this.showGerantForm.set(false);
        this.gerantError.set('');
    }

    createGerant(): void {
        if (this.gerantForm.invalid) return;
        this.submittingGerant.set(true);
        this.gerantError.set('');

        const payload: CreateGerantPayload = {
            first_name: this.gerantForm.value.first_name!,
            last_name: this.gerantForm.value.last_name!,
            email: this.gerantForm.value.email!,
            password: this.gerantForm.value.password!,
            complexe_id: Number(this.gerantForm.value.complexe_id),
            phone: this.gerantForm.value.phone || undefined,
        };

        this.gerantSvc.create(payload).subscribe({
            next: (newGerant) => {
                this.submittingGerant.set(false);
                this.closeGerantForm();
                this.gerants.update(g => [...g, newGerant]);
                this.updateUnassignedComplexes();
                this.toastSvc.success('Gérant créé avec succès.');

                const companyName = this.gerantForm.value.company_name?.trim();
                if (companyName) {
                    this.societeSvc.create({ nom_soc: companyName }).subscribe({
                        next: () => console.log('Société créée:', companyName),
                        error: () => console.warn('Impossible de créer la société automatiquement.')
                    });
                }
            },
            error: (err) => {
                this.submittingGerant.set(false);
                this.gerantError.set(err?.error?.message || err.message || 'Erreur lors de la création.');
                this.toastSvc.error(this.gerantError());
            },
        });
    }

    deactivateGerant(id: number): void {
        if (!confirm('Désactiver ce gérant ? Le complexe sera libéré.')) return;
        this.gerantSvc.deactivate(id).subscribe({
            next: () => {
                this.loadGerants();
                this.toastSvc.success('Gérant désactivé. Complexe libéré.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la désactivation.'),
        });
    }

    activateGerant(id: number): void {
        this.gerantSvc.activate(id).subscribe({
            next: () => {
                this.loadGerants();
                this.toastSvc.success('Gérant activé.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'activation.'),
        });
    }

    deleteGerant(id: number): void {
        if (!confirm('Attention: Supprimer ce gérant est PERMANENT et libère son complexe. Cette action est irréversible. Continuer?')) return;
        this.gerantSvc.deleteGerant(id).subscribe({
            next: () => {
                this.loadGerants();
                this.toastSvc.success('Gérant supprimé avec succès.');
            },
            error: (err: any) => this.toastSvc.error(err?.error?.message || 'Erreur lors de la suppression.'),
        });
    }

    // ── Assign / Reassign / Unassign complexe ──────────────────────────

    openAssignComplexeModal(gerant: Gerant): void {
        this.selectedGerantForAssign.set(gerant);
        this.selectedAssignComplexeId.set(gerant.complexe?.id ?? null);
        this.assignComplexeError.set('');

        // Compute available complexes: all complexes that are unassigned + the gerant's current
        const assignedIds = new Set(this.gerants().map(g => g.complexe?.id).filter(Boolean));
        const currentId = gerant.complexe?.id;
        const available = this.complexes().filter(c => !assignedIds.has(c.id) || c.id === currentId);
        this.availableComplexesForAssign.set(available);
        this.showAssignGerantModal.set(true);
    }

    closeAssignComplexeModal(): void {
        this.showAssignGerantModal.set(false);
        this.selectedGerantForAssign.set(null);
        this.assignComplexeError.set('');
    }

    submitAssignComplexe(): void {
        const gerant = this.selectedGerantForAssign();
        if (!gerant) return;
        this.submittingAssignComplexe.set(true);
        this.assignComplexeError.set('');

        this.gerantSvc.assignComplexe(gerant.id, this.selectedAssignComplexeId() ?? null).subscribe({
            next: (updated) => {
                this.submittingAssignComplexe.set(false);
                this.gerants.update(g => g.map(ge => ge.id === updated.id ? updated : ge));
                this.closeAssignComplexeModal();
                this.updateUnassignedComplexes();
                this.toastSvc.success('Complexe mis à jour avec succès.');
            },
            error: (err) => {
                this.submittingAssignComplexe.set(false);
                this.assignComplexeError.set(err?.error?.message || err.message || 'Erreur lors de l\'assignation.');
                this.toastSvc.error(this.assignComplexeError());
            },
        });
    }

    unassignComplexe(gerant: Gerant): void {
        if (!confirm(`Retirer le complexe "${gerant.complexe?.name}" de ${gerant.first_name} ${gerant.last_name} ?`)) return;
        this.gerantSvc.assignComplexe(gerant.id, null).subscribe({
            next: (updated) => {
                this.gerants.update(g => g.map(ge => ge.id === updated.id ? updated : ge));
                this.updateUnassignedComplexes();
                this.toastSvc.success('Complexe retiré du gérant.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors du retrait.'),
        });
    }

    filteredGerants() {
        const search = this.searchGerants().toLowerCase();
        return this.gerants().filter(g =>
            `${g.first_name} ${g.last_name}`.toLowerCase().includes(search) ||
            g.email.toLowerCase().includes(search) ||
            (g.complexe?.name || '').toLowerCase().includes(search)
        );
    }

    get totalComplexes(): number {
        return this.complexes().length;
    }

    get totalTerrains(): number {
        return this.allTerrains().length;
    }

    get totalClients(): number {
        return this.clients().length;
    }

    get totalReservations(): number {
        return this.reservations().length;
    }

    get totalActivities(): number {
        return this.activites().length;
    }

    get totalActivityReservations(): number {
        return this.activiteReservations().length;
    }

    get totalSubscriptionTypes(): number {
        return this.subscriptionTypes().length;
    }

    get totalClientSubscriptions(): number {
        return this.clientSubscriptions().length;
    }

    get joursOptions(): { key: string; label: string }[] {
        return [
            { key: 'lundi', label: 'Lundi' },
            { key: 'mardi', label: 'Mardi' },
            { key: 'mercredi', label: 'Mercredi' },
            { key: 'jeudi', label: 'Jeudi' },
            { key: 'vendredi', label: 'Vendredi' },
            { key: 'samedi', label: 'Samedi' },
            { key: 'dimanche', label: 'Dimanche' },
        ];
    }

    isGerant(): boolean {
        return this.auth.isGerant();
    }

    get user() {
        return this.auth.currentUser();
    }

    ngOnInit(): void {
        this.reload();

        this.manualForm.get('terrain_id')!.valueChanges.subscribe(() => this.loadSlots());
        this.manualForm.get('date_seance_res')!.valueChanges.subscribe(() => this.loadSlots());
        this.manualForm.get('heure_debut_res')!.valueChanges.subscribe(() => this.syncEndTime());
    }

    /** Scroll to the section matching the URL fragment */
    private scrollToCurrentFragment(): void {
        const fragment = this.route.snapshot.fragment;
        if (!fragment) return;

        // Use multiple attempts with requestAnimationFrame for reliable post-render timing
        let attempts = 0;
        const MAX_ATTEMPTS = 30; // ~3 seconds
        const tryScroll = () => {
            const el = document.getElementById(fragment);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            attempts++;
            if (attempts < MAX_ATTEMPTS) {
                requestAnimationFrame(tryScroll);
            }
        };
        // Start from the next animation frame to let the current rendering cycle finish
        requestAnimationFrame(() => requestAnimationFrame(tryScroll));
    }

    loadShopMetrics(): void {
        const today = new Date();
        const isToday = (dateStr: string) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();
        };

        this.productSvc.adminList().subscribe({
            next: (res) => {
                if (res && res.success && res.data) {
                    const products = res.data;
                    this.totalProducts.set(products.filter(p => p.actif).length);
                    this.lowStockProducts.set(products.filter(p => p.stock && p.stock.quantite_disponible <= p.stock.quantite_minimale).length);
                }
            },
            error: () => {}
        });

        this.orderSvc.adminList().subscribe({
            next: (res) => {
                if (res && res.success && res.data) {
                    this.ordersToday.set(res.data.filter(o => isToday(o.created_at)).length);
                }
            },
            error: () => {}
        });

        this.saleSvc.list().subscribe({
            next: (res) => {
                if (res && res.success && res.data) {
                    this.directSalesToday.set(res.data.filter(s => isToday(s.created_at)).length);
                }
            },
            error: () => {}
        });

        this.loadDepensesMois();
        this.loadCategoriesRessource();
    }

    loadCategoriesRessource(): void {
        this.categorySvc.adminList('ressource').subscribe({
            next: (res) => { if (res?.data) this.categoriesRessource.set(res.data); },
            error: () => {}
        });
    }

    loadDepensesMois(): void {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        this.depenseSvc.list({ date_debut: `${ym}-01` }).subscribe({
            next: (res) => {
                if (res && res.success && res.data) {
                    const total = res.data.reduce((s: number, d: any) => s + Number(d.montant_dep || 0), 0);
                    this.depensesMois.set(Math.round(total * 1000) / 1000);
                    this.nbDepensesMois.set(res.data.length);
                    const map = new Map<string, { total: number; count: number }>();
                    for (const d of res.data) {
                        const label = d.type_depense?.designation_ty_dep || 'Autre';
                        const cur = map.get(label) || { total: 0, count: 0 };
                        cur.total += Number(d.montant_dep || 0);
                        cur.count += 1;
                        map.set(label, cur);
                    }
                    const arr = Array.from(map.entries()).map(([designation, v]) => ({
                        designation,
                        total: Math.round(v.total * 1000) / 1000,
                        count: v.count,
                    }));
                    this.depensesParType.set(arr);
                }
            },
            error: () => {}
        });
    }

    reload(): void {
        this.loading.set(true);
        this.errorMessage.set('');
        this.loadShopMetrics();

        const gerantComplexe = this.auth.user()?.complexe;
        if (this.auth.isGerant() && gerantComplexe) {
                this.gerantComplexeId.set(gerantComplexe.id);
                this.selectedComplexId.set(gerantComplexe.id);

                // Execute key loads in parallel and clear loading when all complete
                const obs = [
                    this.terrainSvc.list(gerantComplexe.id).pipe(tap((data) => { this.terrains.set(data); this.loadReservations(); })),
                    this.clientSvc.list().pipe(tap((data) => this.clients.set(data))),
                    this.terrainSvc.list().pipe(tap((data) => this.allTerrains.set(data))),
                    this.activiteSvc.adminGetAll().pipe(tap((data) => this.activites.set(data))),
                    this.activiteSvc.adminGetReservations().pipe(tap((data) => this.activiteReservations.set(data))),
                    this.abonnementSvc.adminGetTypes().pipe(tap((data) => this.subscriptionTypes.set(data))),
                    this.abonnementSvc.adminGetAbonnements().pipe(tap((data) => this.clientSubscriptions.set(data))),
                ];

                forkJoin(obs).subscribe({
                    next: () => this.loading.set(false),
                    error: () => this.loading.set(false),
                });
                return;
        }

        this.complexeSvc.list().subscribe({
            next: (data) => {
                this.complexes.set(data);
                const first = data[0]?.id ?? null;
                this.selectedComplexId.set(first);
                this.societeSvc.list().subscribe({
                    next: (res) => { if (res?.data) this.societes.set(res.data); },
                    error: () => {}
                });

                if (!first && this.auth.isGerant()) {
                    this.terrains.set([]);
                    this.reservations.set([]);
                    this.clients.set([]);
                    this.allTerrains.set([]);
                    this.activites.set([]);
                    this.activiteReservations.set([]);
                    this.subscriptionTypes.set([]);
                    this.clientSubscriptions.set([]);
                    this.loading.set(false);
                    return;
                }

                if (first) {
                    this.loadTerrains(first);
                }

                this.loadGerants();
                this.loadClients();
                this.loadAllTerrains();
                this.loadActivites();
                this.loadActiviteReservations();
                this.loadSubscriptionTypes();
                this.loadClientSubscriptions();
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Failed to load complexes.');
            },
        });
    }

    selectComplex(id: number): void {
        this.selectedComplexId.set(id);
        this.loadTerrains(id);
    }

    private loadTerrains(complexeId: number): void {
        this.terrainSvc.list(complexeId).subscribe({
            next: (data) => {
                this.terrains.set(data);
                this.loadReservations();
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Failed to load courts.');
            },
        });
    }

    private loadAllTerrains(): void {
        this.terrainSvc.list().subscribe({
            next: (data) => this.allTerrains.set(data),
        });
    }

    private loadReservations(): void {
        this.reservationSvc.list().subscribe({
            next: (data) => this.reservations.set(data),
            error: () => this.loading.set(false),
            complete: () => this.loading.set(false),
        });
    }

    private loadActivites(): void {
        this.activiteSvc.adminGetAll().subscribe({
            next: (data) => this.activites.set(data),
        });
    }

    private loadActiviteReservations(): void {
        this.activiteSvc.adminGetReservations().subscribe({
            next: (data) => this.activiteReservations.set(data),
        });
    }

    openActiviteForm(): void {
        this.editingActivite.set(null);
        this.activiteForm.reset({
            complexe_id: this.selectedComplexId(),
            sport: 'yoga',
            niveau: 'tous',
            capacite: 10,
            prix: 45,
            jours: ['lundi'],
        });
        this.showActiviteForm.set(true);
    }

    closeActiviteForm(): void {
        this.showActiviteForm.set(false);
        this.editingActivite.set(null);
    }

    editActivite(activite: Activite): void {
        this.editingActivite.set(activite);
        this.activiteForm.patchValue({
            complexe_id: activite.complexe_id,
            nom: activite.nom,
            description: activite.description ?? '',
            sport: activite.sport,
            niveau: activite.niveau,
            capacite: activite.capacite,
            prix: activite.prix,
            heure_debut: activite.heure_debut,
            heure_fin: activite.heure_fin,
            jours: activite.jours ?? [],
            image: activite.image ?? '',
        });
        this.showActiviteForm.set(true);
    }

    toggleJour(jour: string, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        const current = this.activiteForm.get('jours')?.value ?? [];
        const next = checked
            ? [...current, jour]
            : current.filter((item) => item !== jour);
        this.activiteForm.get('jours')?.setValue(next);
    }

    saveActivite(): void {
        if (this.activiteForm.invalid) return;
        this.submittingActivite.set(true);

        const raw = this.activiteForm.value as any;

        const formatTime = (t: string | null | undefined): string | null => {
            if (!t) return null;
            const m = String(t).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!m) return String(t).trim();
            let h = parseInt(m[1], 10);
            const min = m[2];
            const ampm = (m[3] || '').toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return (h < 10 ? '0' : '') + h + ':' + min;
        };

        const payload = {
            ...raw,
            heure_debut: formatTime(raw.heure_debut),
            heure_fin: formatTime(raw.heure_fin),
            jours: (this.activiteForm.get('jours')?.value ?? []),
        };

        const isEdit = !!this.editingActivite();
        const request = isEdit
            ? this.activiteSvc.adminUpdate(this.editingActivite()!.id, payload)
            : this.activiteSvc.adminCreate(payload);

        request.subscribe({
            next: () => {
                this.submittingActivite.set(false);
                this.closeActiviteForm();
                this.loadActivites();
                this.toastSvc.success(isEdit ? 'Activité modifiée avec succès.' : 'Activité créée avec succès.');
            },
            error: (err) => {
                this.submittingActivite.set(false);
                const msg = err?.error?.message || err.message || 'Erreur lors de l’enregistrement.';
                this.toastSvc.error(msg);
            },
        });
    }

    toggleActiviteActive(activite: Activite): void {
        const payload = { active: !activite.active };
        this.activiteSvc.adminUpdate(activite.id, payload).subscribe({
            next: (updated) => {
                this.loadActivites();
                this.toastSvc.success(`Activité ${updated.active ? 'activée' : 'désactivée'}.`);
            },
            error: (err) => this.toastSvc.error(err?.error?.message || err.message || 'Erreur lors de la mise à jour.'),
        });
    }


    deleteActivite(activite: Activite): void {
        if (!confirm(`Supprimer l’activité « ${activite.nom} » ?`)) return;
        this.activiteSvc.adminDelete(activite.id).subscribe({

            next: () => {
                this.loadActivites();
                this.toastSvc.success('Activité supprimée.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || err.message || 'Impossible de supprimer l’activité.'),
        });
    }

    confirmActivitePayment(reservation: ReservationActivite): void {
        this.selectedActiviteReservationForPayment.set(reservation);
        this.confirmPaymentForm.reset({
            modalite_paiement: 'especes',
            reference: '',
            montant: (reservation as any).montant_paye ?? reservation.activite?.prix ?? 0,
        });
        this.showActivitePaymentModal.set(true);
    }

    executeActivitePayment(): void {
        const reservation = this.selectedActiviteReservationForPayment();
        if (!reservation || this.confirmPaymentForm.invalid) return;

        this.submittingActivite.set(true);
        const val = this.confirmPaymentForm.value;

        this.activiteSvc.adminConfirmPayment(reservation.id, {
            modalite_paiement: val.modalite_paiement as 'especes' | 'carte',
            statut_paiement: 'paye',
            reference: val.reference || undefined,
            montant: Number(val.montant),
        }).subscribe({
            next: () => {
                this.submittingActivite.set(false);
                this.activiteReservations.update((reservations) =>
                    reservations.map((item) =>
                        item.id === reservation.id
                            ? { 
                                ...item, 
                                statut_paiement: 'paye' as const, 
                                statut: item.statut === 'reservee' ? 'confirmee' : item.statut,
                                modalite_paiement: val.modalite_paiement as 'especes' | 'carte'
                              }
                            : item
                    )
                );
                this.loadActiviteReservations();
                this.closeActivitePaymentModal();
                this.toastSvc.success('Paiement confirmé.');
            },
            error: (err) => {
                this.submittingActivite.set(false);
                this.toastSvc.error(err?.error?.message || err.message || 'Impossible de confirmer le paiement.');
                this.closeActivitePaymentModal();
            },
        });
    }

    closeActivitePaymentModal(): void {
        this.showActivitePaymentModal.set(false);
        this.selectedActiviteReservationForPayment.set(null);
    }

    cancelActiviteReservation(reservation: ReservationActivite): void {
        if (!confirm(`Annuler la réservation d'activité de ${reservation.user?.first_name ?? ''} ?`)) return;
        this.activiteSvc.adminCancelReservation(reservation.id).subscribe({
            next: () => {
                this.activiteReservations.update((list) =>
                    list.map((r) => r.id === reservation.id ? { ...r, statut: 'annulee' } : r)
                );
                this.toastSvc.success('Réservation annulée.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || err.message || 'Impossible d\'annuler.'),
        });
    }

    deleteActiviteReservation(reservation: ReservationActivite): void {
        if (!confirm(`Supprimer cette réservation d’activité ?`)) return;
        this.activiteSvc.adminDeleteReservation(reservation.id).subscribe({
            next: () => {
                this.loadActiviteReservations();
                this.toastSvc.success('Réservation supprimée.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || err.message || 'Impossible de supprimer.'),
        });
    }

    niveauActiviteLabel(niveau: string): string {
        const map: Record<string, string> = {
            debutant: 'Débutant',
            intermediaire: 'Intermédiaire',
            expert: 'Expert',
            tous: 'Tous',
        };
        return map[niveau] ?? niveau;
    }

    getActiviteReservationStatusBadge(res: ReservationActivite): { label: string; class: string } {
        switch (res.statut) {
            case 'reservee':
                return { label: 'Réservée', class: 'status-pending' };
            case 'confirmee':
                return { label: 'Confirmée', class: 'status-confirmed' };
            case 'annulee':
                return { label: 'Annulée', class: 'status-cancelled' };
            default:
                return { label: res.statut, class: '' };
        }
    }

    getActiviteReservationPaymentBadge(res: ReservationActivite): { label: string; class: string } {
        return res.statut_paiement === 'paye'
            ? { label: 'Payé', class: 'payment-cash' }
            : { label: 'Non payé', class: 'payment-pending' };
    }

    canConfirmActivitePayment(res: ReservationActivite): boolean {
        return res.statut_paiement === 'non_paye' && (res.statut === 'reservee' || res.statut === 'confirmee');
    }

    private loadSlots(): void {
        const terrainId = this.manualForm.get('terrain_id')!.value;
        const date = this.manualForm.get('date_seance_res')!.value;
        if (!terrainId || !date) {
            this.availableSlots.set([]);
            return;
        }
        this.slotsLoading.set(true);
        this.terrainSvc.getSlots(Number(terrainId), date).subscribe({
            next: (slots) => {
                this.availableSlots.set(slots.filter((s) => s.available));
                this.slotsLoading.set(false);
            },
            error: () => this.slotsLoading.set(false),
        });
    }

    private syncEndTime(): void {
        const start = this.manualForm.get('heure_debut_res')!.value;
        if (!start) return;
        const [h, m] = start.split(':').map(Number);
        const endH = (h + 1) % 24;
        const endStr = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        this.manualForm.get('heure_fin_res')!.setValue(endStr, { emitEvent: false });
    }

    openManualForm(): void {
        this.manualForm.reset({ modalite_paiement: 'especes' });
        this.availableSlots.set([]);
        this.showManualForm.set(true);
    }

    closeManualForm(): void {
        this.showManualForm.set(false);
    }

    submitManualReservation(): void {
        if (this.manualForm.invalid) return;
        this.submittingManual.set(true);

        const val = this.manualForm.value;
        this.reservationSvc.createManual({
            terrain_id: Number(val.terrain_id),
            date_seance_res: val.date_seance_res!,
            heure_debut_res: val.heure_debut_res!,
            heure_fin_res: val.heure_fin_res!,
            client_id: Number(val.client_id),
            modalite_paiement: val.modalite_paiement as 'especes' | 'carte',
            notes: val.notes || undefined,
        }).subscribe({
            next: () => {
                this.submittingManual.set(false);
                this.showManualForm.set(false);
                this.loadReservations();
                this.toastSvc.success('Réservation manuelle créée avec succès.');
            },
            error: (err) => {
                this.submittingManual.set(false);
                const msg = err?.error?.message || err.message || 'Erreur lors de la création.';
                this.toastSvc.error(msg);
            },
        });
    }

    // ──────────────────────────────────────────────
    // COMPLEXE CRUD (create + edit)
    // ──────────────────────────────────────────────

    openComplexForm(complexe?: Complexe): void {
        this.editingComplex.set(complexe ?? null);

        if (complexe) {
            const gallery = complexe.images?.map((img) => img.image_url) ?? [];
            this.galleryImages.set(gallery);

            this.complexForm.patchValue({
                name: complexe.name,
                address: complexe.address,
                city: complexe.city ?? '',
                phone: complexe.phone ?? '',
                description: complexe.description ?? '',
                image_url: complexe.image_url ?? complexe.image_c ?? '',
                facebook_url: complexe.facebook_url ?? complexe.facebook_c ?? '',
                instagram_url: complexe.instagram_url ?? complexe.instagram_c ?? '',
                website_url: complexe.website_url ?? complexe.website_c ?? '',
                gallery_images: gallery,
            });
        } else {
            this.galleryImages.set([]);
            this.complexForm.reset();
            this.complexForm.patchValue({ gallery_images: [] });
        }
        this.showComplexForm.set(true);
    }

    saveComplex(): void {
        if (this.complexForm.invalid) return;
        this.submittingComplex.set(true);

        const currentGallery = this.galleryImages();
        const originalGallery = this.editingComplex()
            ?.images?.map((i: any) => i.image_url) ?? [];
        const galleryChanged =
            JSON.stringify(currentGallery) !== JSON.stringify(originalGallery);

        const payload: any = { ...this.complexForm.value };
        if (galleryChanged) {
            payload.gallery_images = currentGallery;
        } else {
            delete payload.gallery_images;
        }

        const isEdit = !!this.editingComplex();

        const request = isEdit
            ? this.complexeSvc.update(this.editingComplex()!.id, payload)
            : this.complexeSvc.create(payload);

        request.subscribe({
            next: () => {
                this.submittingComplex.set(false);
                this.showComplexForm.set(false);
                this.editingComplex.set(null);
                this.reload();
                this.toastSvc.success(isEdit ? 'Complexe modifié avec succès.' : 'Complexe créé avec succès.');
            },
            error: (err) => {
                this.submittingComplex.set(false);
                this.toastSvc.error(err?.error?.message || err.message || 'Erreur lors de l\'enregistrement.');
            },
        });
    }

    cancelComplexForm(): void {
        this.showComplexForm.set(false);
        this.editingComplex.set(null);
        this.complexForm.reset();
        this.galleryImages.set([]);
    }

    addGalleryImage(): void {
        this.galleryImages.update((images) => [...images, '']);
    }

    updateGalleryImage(index: number, value: string): void {
        this.galleryImages.update((images) => images.map((img, idx) => idx === index ? value : img));
        this.complexForm.patchValue({ gallery_images: this.galleryImages() });
    }

    removeGalleryImage(index: number): void {
        this.galleryImages.update((images) => images.filter((_, idx) => idx !== index));
        this.complexForm.patchValue({ gallery_images: this.galleryImages() });
    }

    createComplex(): void {
        this.openComplexForm();
    }

    deleteComplex(complexe: Complexe): void {
        if (!confirm(`Supprimer le complexe "${complexe.name}" et tous ses terrains ? Cette action est irréversible.`)) return;
        this.complexeSvc.delete(complexe.id).subscribe({
            next: () => {
                this.complexes.update((list) => list.filter((c) => c.id !== complexe.id));
                if (this.selectedComplexId() === complexe.id) {
                    this.selectedComplexId.set(null);
                    this.terrains.set([]);
                }
                this.toastSvc.success('Complexe supprimé.');
            },
            error: (err) => {
                const msg = err?.error?.message || err.message || 'Impossible de supprimer le complexe.';
                this.toastSvc.error(msg);
            },
        });
    }

    // ──────────────────────────────────────────────
    // TERRAIN CRUD (create + edit)
    // ──────────────────────────────────────────────

    openTerrainForm(terrain?: Terrain): void {
        this.editingTerrain.set(terrain ?? null);
        if (terrain) {
            this.terrainForm.patchValue({
                name: terrain.name,
                sport_type: terrain.sport_type,
                price_per_hour: Number(terrain.price_per_hour),
                image_url: terrain.image_url ?? (terrain as any).image_t ?? '',
            });
        } else {
            this.terrainForm.reset({ sport_type: 'padel', price_per_hour: 45 });
        }
        this.showTerrainForm.set(true);
    }

    saveTerrain(): void {
        const complexeId = this.selectedComplexId();
        if (!complexeId || this.terrainForm.invalid) return;
        this.submittingTerrain.set(true);

        const payload = { ...(this.terrainForm.value as any), complexe_id: complexeId };
        const isEdit = !!this.editingTerrain();

        const request = isEdit
            ? this.terrainSvc.update(this.editingTerrain()!.id, payload)
            : this.terrainSvc.create(payload);

        request.subscribe({
            next: () => {
                this.submittingTerrain.set(false);
                this.showTerrainForm.set(false);
                this.editingTerrain.set(null);
                this.loadTerrains(complexeId);
                this.loadAllTerrains();
                this.toastSvc.success(isEdit ? 'Terrain modifié avec succès.' : 'Terrain créé avec succès.');
            },
            error: (err) => {
                this.submittingTerrain.set(false);
                this.toastSvc.error(err?.error?.message || err.message || 'Erreur lors de l\'enregistrement.');
            },
        });
    }

    cancelTerrainForm(): void {
        this.showTerrainForm.set(false);
        this.editingTerrain.set(null);
        this.terrainForm.reset({ sport_type: 'padel', price_per_hour: 45 });
    }

    createTerrain(): void {
        this.openTerrainForm();
    }

    deleteTerrains(terrain: Terrain): void {
        if (!confirm(`Supprimer le terrain "${terrain.name}" ? Cette action est irréversible.`)) return;
        this.terrainSvc.delete(terrain.id).subscribe({
            next: () => {
                this.terrains.update((list) => list.filter((t) => t.id !== terrain.id));
                this.toastSvc.success('Terrain supprimé.');
            },
            error: (err) => {
                const msg = err?.error?.message || err.message || 'Impossible de supprimer le terrain.';
                this.toastSvc.error(msg);
            },
        });
    }

    // ──────────────────────────────────────────────
    // RESERVATION EDIT
    // ──────────────────────────────────────────────

    openEditReservationForm(r: Reservation): void {
        this.editingReservation.set(r);
        this.editReservationForm.patchValue({
            status: r.status,
            statut_paiement: r.statut_paiement ?? 'non_paye',
            modalite_paiement: r.modalite_paiement ?? 'especes',
            notes: r.notes ?? '',
        });
        this.showEditReservationForm.set(true);
    }

    closeEditReservationForm(): void {
        this.showEditReservationForm.set(false);
        this.editingReservation.set(null);
    }

    submitEditReservation(): void {
        const r = this.editingReservation();
        if (!r || this.editReservationForm.invalid) return;
        this.submittingReservationEdit.set(true);

        const val = this.editReservationForm.value;
        const payload: any = {};
        if (val.status) payload.status = val.status;
        if (val.statut_paiement) payload.statut_paiement = val.statut_paiement;
        if (val.modalite_paiement) payload.modalite_paiement = val.modalite_paiement;
        if (val.notes !== undefined) payload.notes = val.notes;

        this.reservationSvc.update(r.id, payload).subscribe({
            next: () => {
                this.submittingReservationEdit.set(false);
                this.closeEditReservationForm();
                this.loadReservations();
                this.toastSvc.success('Réservation mise à jour.');
            },
            error: (err) => {
                this.submittingReservationEdit.set(false);
                this.toastSvc.error(err?.error?.message || err.message || 'Erreur lors de la mise à jour.');
            },
        });
    }

    confirmCashPayment(reservation: Reservation): void {
        this.selectedForEspeces.set(reservation);
        this.showEspecesModal.set(true);
    }

    executeEspecesPayment(): void {
        const reservation = this.selectedForEspeces();
        if (!reservation) return;

        this.reservationSvc.confirmCashPayment(reservation.id).subscribe({
            next: () => {
                this.loadReservations();
                this.toastSvc.success('Paiement espèces confirmé.');
                this.closeEspecesModal();
            },
            error: (err) => {
                const msg = err?.error?.message || err.message || 'Impossible de confirmer le paiement.';
                this.toastSvc.error(msg);
                this.closeEspecesModal();
            },
        });
    }

    closeEspecesModal(): void {
        this.showEspecesModal.set(false);
        this.selectedForEspeces.set(null);
    }

    cancelReservation(reservation: Reservation): void {
        if (!confirm(`Annuler la réservation de ${reservation.user?.first_name ?? ''} ?`)) return;
        this.reservationSvc.cancel(reservation.id).subscribe({
            next: () => this.loadReservations(),
            error: (err) => {
                const msg = err?.error?.message || err.message || 'Impossible d\'annuler.';
                this.toastSvc.error(msg);
            },
        });
    }

    deleteReservation(reservation: Reservation): void {
        if (!confirm(`Supprimer définitivement la réservation de ${reservation.user?.first_name ?? ''} ? Cette action est irréversible.`)) return;
        this.reservationSvc.delete(reservation.id).subscribe({
            next: () => {
                this.loadReservations();
                this.toastSvc.success('Réservation supprimée.');
            },
            error: (err) => {
                const msg = err?.error?.message || err.message || 'Impossible de supprimer.';
                this.toastSvc.error(msg);
            },
        });
    }

    private loadClients(): void {
        this.clientSvc.list().subscribe({
            next: (data) => this.clients.set(data),
            error: (err) => this.errorMessage.set(err.message || 'Failed to load clients.'),
        });
    }

    toggleClientActive(client: Client): void {
        this.clientSvc.setActive(client.id, !client.is_active).subscribe({
            next: (updated) => {
                this.clients.update((list) =>
                    list.map((c) => (c.id === updated.id ? updated : c))
                );
            },
            error: (err) => this.errorMessage.set(err.message || 'Could not update client.'),
        });
    }

    getStatusBadge(res: Reservation): { label: string, class: string } {
        if (res.status === 'cancelled') {
            return { label: 'Annulé', class: 'bg-red-100 text-red-700' };
        }
        if (res.status === 'expired') {
            return { label: 'Expiré', class: 'bg-gray-100 text-gray-600' };
        }
        if (res.status === 'played') {
            return { label: 'Joué', class: 'bg-blue-100 text-blue-700' };
        }
        if (res.status === 'pending') {
            return { label: 'En attente', class: 'bg-yellow-100 text-yellow-700' };
        }
        if (res.status === 'confirmed') {
            return { label: 'Confirmé', class: 'bg-green-100 text-green-700' };
        }
        return { label: 'Inconnu', class: 'bg-gray-100 text-gray-600' };
    }

    getPaymentStatusBadge(res: Reservation): { label: string, class: string } {
        if (res.statut_paiement === 'paye') {
            return { label: 'Payé', class: 'bg-green-100 text-green-700' };
        }
        if (res.statut_paiement === 'rembourse') {
            return { label: 'Remboursé', class: 'bg-blue-100 text-blue-700' };
        }
        return { label: 'Non payé', class: 'bg-orange-100 text-orange-700' };
    }

    canConfirmCashPayment(res: Reservation): boolean {
        return res.modalite_paiement === 'especes' && res.statut_paiement === 'non_paye';
    }

    selectedComplexName(): string {
        const id = this.selectedComplexId();
        return this.complexes().find((c) => c.id === id)?.name ?? '';
    }

    scrollToSection(sectionId: string): void {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Filtered data based on search
    filteredClients() {
        const search = this.searchClients().toLowerCase();
        return this.clients().filter(c =>
            c.first_name.toLowerCase().includes(search) ||
            c.last_name.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            (c.phone || '').includes(search)
        );
    }

    filteredReservations() {
        const search = this.searchReservations().toLowerCase();
        return this.reservations().filter(r =>
            (r.terrain?.name || '').toLowerCase().includes(search) ||
            (r.user?.first_name || '').toLowerCase().includes(search) ||
            (r.user?.last_name || '').toLowerCase().includes(search)
        );
    }

    filteredActivites() {
        const search = this.searchActivites().toLowerCase();
        return this.activites().filter(a =>
            a.nom.toLowerCase().includes(search) ||
            (a.complexe?.name || '').toLowerCase().includes(search) ||
            a.sport.toLowerCase().includes(search)
        );
    }

    filteredActiviteReservations() {
        const search = this.searchActiviteReservations.toLowerCase().trim();
        if (!search) return this.activiteReservations();
        return this.activiteReservations().filter(ra =>
            (ra.user?.first_name || '').toLowerCase().includes(search) ||
            (ra.user?.last_name || '').toLowerCase().includes(search) ||
            `${ra.user?.first_name || ''} ${ra.user?.last_name || ''}`.toLowerCase().includes(search)
        );
    }

    filteredSubscriptionTypes() {
        const search = this.searchTypes().toLowerCase();
        const cid = this.selectedComplexeFilter();
        return this.subscriptionTypes().filter(t => {
            const matchesSearch = t.nom.toLowerCase().includes(search) ||
                (t.sport_cible || '').toLowerCase().includes(search) ||
                (t.description || '').toLowerCase().includes(search);
            const matchesComplexe = !cid || Number(t.complexe_id) === Number(cid);
            return matchesSearch && matchesComplexe;
        });
    }

    // ──────────────────────────────────────────────
    // SUBSCRIPTION MANAGEMENT METHODS
    // ──────────────────────────────────────────────

    loadSubscriptionTypes(): void {
        this.abonnementSvc.adminGetTypes().subscribe({
            next: (types) => this.subscriptionTypes.set(types),
            error: () => console.error('Failed to load subscription types')
        });
    }

    loadClientSubscriptions(): void {
        this.abonnementSvc.adminGetAbonnements().subscribe({
            next: (subs) => this.clientSubscriptions.set(subs),
            error: () => console.error('Failed to load client subscriptions')
        });
    }

    openTypeForm(): void {
        this.editingType.set(null);
        const defaultComplexeId = this.auth.isGerant() ? this.gerantComplexeId() : this.selectedComplexId();
        this.typeForm.reset({
            complexe_id: defaultComplexeId,
            nb_mois: 1,
            tarif: 0,
            prix_unitaire: 0,
            niveau_sportif_cible: 'tous',
            sport_cible: '',
            avantages: '',
        });
        this.showTypeForm.set(true);
    }

    closeTypeForm(): void {
        this.showTypeForm.set(false);
        this.editingType.set(null);
    }

    editType(type: TypeAbonnement): void {
        this.editingType.set(type);
        this.typeForm.patchValue({
            complexe_id: type.complexe_id,
            nom: type.nom,
            description: type.description ?? '',
            nb_mois: type.nb_mois,
            tarif: type.tarif,
            prix_unitaire: type.prix_unitaire,
            niveau_sportif_cible: type.niveau_sportif_cible,
            sport_cible: type.sport_cible ?? '',
            avantages: type.avantages ? type.avantages.join(', ') : '',
        });
        this.showTypeForm.set(true);
    }

    saveType(): void {
        if (this.typeForm.invalid) return;
        this.submittingType.set(true);

        const val = this.typeForm.value;
        const advantagesArray = val.avantages ? val.avantages.split(',').map(s => s.trim()).filter(Boolean) : [];

        const payload = {
            complexe_id: Number(val.complexe_id),
            nom: val.nom!,
            description: val.description || undefined,
            nb_mois: Number(val.nb_mois),
            tarif: Number(val.tarif),
            prix_unitaire: Number(val.prix_unitaire),
            niveau_sportif_cible: val.niveau_sportif_cible as 'debutant' | 'intermediaire' | 'expert',
            sport_cible: val.sport_cible || undefined,
            avantages: advantagesArray,
        };

        const isEdit = !!this.editingType();
        const request = isEdit
            ? this.abonnementSvc.adminUpdateType(this.editingType()!.id, payload)
            : this.abonnementSvc.adminStoreType(payload);

        request.subscribe({
            next: () => {
                this.submittingType.set(false);
                this.showTypeForm.set(false);
                this.loadSubscriptionTypes();
                this.toastSvc.success(isEdit ? 'Type d\'abonnement modifié.' : 'Type d\'abonnement créé.');
            },
            error: (err) => {
                this.submittingType.set(false);
                const msg = err?.error?.message || err.message || 'Erreur lors de l\'enregistrement.';
                this.toastSvc.error(msg);
            }
        });
    }

    toggleTypeActive(type: TypeAbonnement): void {
        const payload = { active: !type.active };
        this.submittingType.set(true);
        this.abonnementSvc.adminUpdateType(type.id, payload).subscribe({
            next: (updated) => {
                this.loadSubscriptionTypes();
                this.submittingType.set(false);
                this.toastSvc.success(`Type d'abonnement ${updated.active ? 'activé' : 'désactivé'}.`);
            },
            error: (err) => {
                this.submittingType.set(false);
                this.toastSvc.error(err?.error?.message || 'Erreur lors de la mise à jour du statut.');
            },
        });
    }

    confirmAbonnementPayment(sub: AbonnementAdherent): void {
        this.selectedSubForPayment.set(sub);
        this.confirmPaymentForm.reset({
            modalite_paiement: 'especes',
            reference: '',
            montant: sub.montant_apres_remise,
        });
        this.showConfirmPaymentModal.set(true);
    }

    executeAbonnementPayment(): void {
        const sub = this.selectedSubForPayment();
        if (!sub || this.confirmPaymentForm.invalid) return;
        const val = this.confirmPaymentForm.value;

        this.abonnementSvc.adminConfirmPayment(sub.id, {
            modalite_paiement: val.modalite_paiement as 'especes' | 'carte',
            reference: val.reference || undefined,
            montant: Number(val.montant),
        }).subscribe({
            next: () => {
                this.loadClientSubscriptions();
                this.closeConfirmPaymentModal();
                this.toastSvc.success('Paiement de l\'abonnement confirmé.');
            },
            error: (err) => {
                this.toastSvc.error(err?.error?.message || 'Erreur lors de la confirmation.');
                this.closeConfirmPaymentModal();
            }
        });
    }

    closeConfirmPaymentModal(): void {
        this.showConfirmPaymentModal.set(false);
        this.selectedSubForPayment.set(null);
    }

    cancelAbonnement(sub: AbonnementAdherent): void {
        if (!confirm(`Annuler l'abonnement de ${sub.user?.first_name} ${sub.user?.last_name} ?`)) return;
        this.abonnementSvc.adminCancel(sub.id).subscribe({
            next: () => {
                this.loadClientSubscriptions();
                this.toastSvc.success('Abonnement annulé.');
            },
            error: (err) => this.toastSvc.error(err?.error?.message || 'Erreur lors de l\'annulation.')
        });
    }

    // ──────────────────────────────────────────────
    // ENHANCED BADGE STYLING METHODS
    // ──────────────────────────────────────────────

    getReservationStatusStyle(status: string): { bg: string; text: string; icon: string } {
        switch (status) {
            case 'confirmed':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✓' };
            case 'pending':
                return { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⏱' };
            case 'cancelled':
                return { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' };
            case 'expired':
                return { bg: 'bg-slate-100', text: 'text-slate-600', icon: '⏳' };
            case 'played':
                return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '✔' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '○' };
        }
    }

    getPaymentStatusStyle(status: string): { bg: string; text: string; icon: string } {
        switch (status) {
            case 'paye':
            case 'paid':
                return { bg: 'bg-green-100', text: 'text-green-700', icon: '💰' };
            case 'non_paye':
            case 'unpaid':
                return { bg: 'bg-orange-100', text: 'text-orange-700', icon: '⏳' };
            case 'remboursé':
            case 'refunded':
                return { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '↺' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '○' };
        }
    }

    getActivityReservationStatusStyle(status: string): { bg: string; text: string; icon: string } {
        switch (status) {
            case 'confirmee':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✓' };
            case 'reservee':
                return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📌' };
            case 'annulee':
                return { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '○' };
        }
    }

    getSubscriptionStatusStyle(status: string): { bg: string; text: string; icon: string } {
        const normalizedStatus = (status || '').toLowerCase().trim();
        switch (normalizedStatus) {
            case 'actif':
            case 'active':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✓' };
            case 'expire':
            case 'expired':
            case 'expiré':
            case 'expirée':
                return { bg: 'bg-slate-100', text: 'text-slate-600', icon: '⏳' };
            case 'annule':
            case 'annulé':
            case 'cancelled':
            case 'canceled':
                return { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' };
            case 'en_attente':
            case 'pending':
                return { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⏱' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '○' };
        }
    }

    getClientStatusStyle(isActive: boolean): { bg: string; text: string; icon: string } {
        return isActive
            ? { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✓' }
            : { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' };
    }

    getActivityStatusStyle(isActive: boolean): { bg: string; text: string; icon: string } {
        return isActive
            ? { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✓' }
            : { bg: 'bg-slate-100', text: 'text-slate-600', icon: '⊘' };
    }
}
