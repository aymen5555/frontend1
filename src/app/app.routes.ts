import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { VerifyPendingComponent } from './auth/verify-pending/verify-pending.component';
import { HomeComponent } from './pages/home/home.component';
import { LandingComponent } from './pages/landing/landing.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TerrainsComponent } from './pages/terrains/terrains.component';
import { ReservationsComponent } from './pages/reservations/reservations.component';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { ComplexeProfileComponent } from './pages/complexe-profile/complexe-profile.component';
import { ProfilFitnessComponent } from './pages/profil-fitness/profil-fitness.component';
import { ProfilComponent } from './pages/profil/profil.component';
import { SubscriptionComponent } from './pages/abonnements/subscription.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ActivitesComponent } from './pages/activites/activites.component';
import { MesActivitesComponent } from './pages/mes-activites/mes-activites.component';
import { HistoriqueReservationsComponent } from './pages/historique/historique-reservations.component';
import { HistoriqueAbonnementsComponent } from './pages/historique/historique-abonnements.component';
import { ComplexesListComponent } from './pages/complexes-list/complexes-list.component';
import { MesAbonnementsComponent } from './pages/mes-abonnements/mes-abonnements.component';
import { BrowseSubscriptionsComponent } from './components/subscriptions/browse-subscriptions/browse-subscriptions.component';
import { SubscriptionAdminComponent } from './components/subscriptions/admin/subscription-admin.component';
import { AdminReservationsComponent } from './admin/reservations/admin-reservations.component';
import { AdminActivitesComponent } from './admin/activites/admin-activites.component';
import { authGuard, gerantGuard, superAdminGuard, guestGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'auth/verify-email', component: VerifyEmailComponent },
{ path: 'auth/verify-pending', component: VerifyPendingComponent },

   // ── Password Reset ──────────────────────────────────────────────────────────
  { path: 'auth/forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'auth/reset-password', loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), canActivate: [guestGuard] },

   // ── Public ────────────────────────────────────────────────────────────────
  { path: '', component: LandingComponent, canActivate: [guestGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard], data: { redirectAdmin: true } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'complexes', component: ComplexesListComponent },
  { path: 'terrains', component: TerrainsComponent },
  { path: 'complexes/:id', component: ComplexeProfileComponent },
  { path: 'activites', component: ActivitesComponent },
  { path: 'abonnements/parcourir', component: BrowseSubscriptionsComponent },

  // ── Client (auth required) ────────────────────────────────────────────────
  { path: 'reservations', component: ReservationsComponent, canActivate: [authGuard] },
  { path: 'abonnements', component: SubscriptionComponent, canActivate: [authGuard] },
  { path: 'mes-abonnements', component: MesAbonnementsComponent, canActivate: [authGuard] },
  { path: 'abonnements/mes-abonnements', redirectTo: '/mes-abonnements', pathMatch: 'full' },
  { path: 'profil', component: ProfilComponent, canActivate: [authGuard] },
  { path: 'mon-profil-fitness', component: ProfilFitnessComponent, canActivate: [authGuard] },
  { path: 'mes-activites', component: MesActivitesComponent, canActivate: [authGuard] },
  { path: 'historique/reservations', component: HistoriqueReservationsComponent, canActivate: [authGuard] },
  { path: 'historique/abonnements', component: HistoriqueAbonnementsComponent, canActivate: [authGuard] },

  // ── Sprint 7: Client Shop & Orders (lazy-loaded) ──────────────────────────
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/shop/shop.component').then(m => m.ShopComponent),
  },
  {
    path: 'shop/products/:id',
    loadComponent: () =>
      import('./features/shop/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/orders/cart/cart.component').then(m => m.CartComponent),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/orders/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./features/orders/my-orders/my-orders.component').then(m => m.MyOrdersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-orders/:id',
    loadComponent: () =>
      import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [authGuard]
  },

  // ── Admin / Gérant ────────────────────────────────────────────────────────
  { path: 'admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'admin/reservations', component: AdminReservationsComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'admin/activites', component: AdminActivitesComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'admin/abonnements', component: SubscriptionAdminComponent, canActivate: [authGuard, gerantGuard] },

  // ── Sprint 7: Admin Shop Management (lazy-loaded) ─────────────────────────
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./features/admin-products/product-list/product-list.component').then(m => m.ProductListComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/products/create',
    loadComponent: () =>
      import('./features/admin-products/product-create/product-create.component').then(m => m.ProductCreateComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/products/edit/:id',
    loadComponent: () =>
      import('./features/admin-products/product-create/product-create.component').then(m => m.ProductCreateComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./features/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/suppliers',
    loadComponent: () =>
      import('./features/admin-suppliers/admin-suppliers.component').then(m => m.AdminSuppliersComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/sales',
    loadComponent: () =>
      import('./features/admin-sales/admin-sales.component').then(m => m.AdminSalesComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/fournisseurs-internes',
    loadComponent: () =>
      import('./features/admin-fournisseurs-internes/admin-fournisseurs-internes.component').then(m => m.AdminFournisseursInternesComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/bons-entree',
    loadComponent: () =>
      import('./features/admin-bon-entree/admin-bon-entree.component').then(m => m.AdminBonEntreeComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/bons-sortie',
    loadComponent: () =>
      import('./features/admin-bon-sortie/admin-bon-sortie.component').then(m => m.AdminBonSortieComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/galerie',
    loadComponent: () =>
      import('./features/admin-galerie/admin-galerie.component').then(m => m.AdminGalerieComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/types-depenses',
    loadComponent: () =>
      import('./features/admin-types-depenses/admin-types-depenses.component').then(m => m.AdminTypesDepensesComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/depenses',
    loadComponent: () =>
      import('./features/admin-depenses/admin-depenses.component').then(m => m.AdminDepensesComponent),
    canActivate: [authGuard, gerantGuard]
  },
  {
    path: 'admin/societes',
    loadComponent: () =>
      import('./features/admin-societes/admin-societes.component').then(m => m.AdminSocietesComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  {
    path: 'admin/equipements',
    loadComponent: () =>
      import('./features/admin-equipements/admin-equipements.component').then(m => m.AdminEquipementsComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  {
    path: 'admin/details-abonnements',
    loadComponent: () =>
      import('./features/admin-details-abonnements/admin-details-abonnements.component').then(m => m.AdminDetailsAbonnementsComponent),
    canActivate: [authGuard, gerantGuard]
  },

  // ── Super Admin ───────────────────────────────────────────────────────────
  {
    path: 'admin/categories',
    loadComponent: () =>
      import('./features/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  { path: 'super-admin', redirectTo: '/super-admin/dashboard', pathMatch: 'full' },
  { path: 'super-admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, superAdminGuard] },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];