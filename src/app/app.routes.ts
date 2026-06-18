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
  { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'auth/verify-email', component: VerifyEmailComponent },
  { path: 'auth/verify-pending', component: VerifyPendingComponent },
  
  { path: '', component: LandingComponent, canActivate: [guestGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard], data: { redirectAdmin: true } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'complexes', component: ComplexesListComponent },
  { path: 'terrains', component: TerrainsComponent },
  { path: 'reservations', component: ReservationsComponent, canActivate: [authGuard] },
  { path: 'complexes/:id', component: ComplexeProfileComponent },
  { path: 'abonnements', component: SubscriptionComponent, canActivate: [authGuard] },
  { path: 'mes-abonnements', component: MesAbonnementsComponent, canActivate: [authGuard] },
  { path: 'abonnements/parcourir', component: BrowseSubscriptionsComponent },
  { path: 'abonnements/mes-abonnements', redirectTo: '/mes-abonnements', pathMatch: 'full' },
  { path: 'admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'admin/reservations', component: AdminReservationsComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'admin/activites', component: AdminActivitesComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'admin/abonnements', component: SubscriptionAdminComponent, canActivate: [authGuard, gerantGuard] },
  { path: 'super-admin', redirectTo: '/super-admin/dashboard', pathMatch: 'full' },
  { path: 'super-admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, superAdminGuard] },
  { path: 'mon-profil-fitness', component: ProfilFitnessComponent, canActivate: [authGuard] },
  { path: 'activites', component: ActivitesComponent },
  { path: 'mes-activites', component: MesActivitesComponent, canActivate: [authGuard] },
  { path: 'historique/reservations', component: HistoriqueReservationsComponent, canActivate: [authGuard] },
  { path: 'historique/abonnements', component: HistoriqueAbonnementsComponent, canActivate: [authGuard] },
  
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];