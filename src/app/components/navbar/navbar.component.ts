import { Component, inject, signal, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  cart = inject(CartService);
  notificationSvc = inject(NotificationService);
  private readonly el = inject(ElementRef);
  router = inject(Router);

  mobileMenuOpen = signal(false);
  showClientEspace = signal(false);
  showGerantBoutique = signal(false);
  showGerantOffice = signal(false);
  showNotifications = signal(false);

  private pollInterval: any;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showClientEspace.set(false);
      this.showGerantBoutique.set(false);
      this.showGerantOffice.set(false);
      this.showNotifications.set(false);
    }
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.notificationSvc.loadNotifications().subscribe();
      this.pollInterval = setInterval(() => {
        if (this.auth.isLoggedIn()) {
          this.notificationSvc.loadNotifications().subscribe();
        }
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  get initials(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  }

  get cartCount(): number {
    return this.cart.totalItems();
  }

  getHomeRoute(): string {
    if (!this.auth.isLoggedIn()) return '/';
    return '/home';
  }

  isRouteActive(prefixes: string[]): boolean {
    return prefixes.some(p => this.router.url.startsWith(p));
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleClientEspace(event: Event): void {
    event.stopPropagation();
    this.showClientEspace.update(v => !v);
    this.showGerantBoutique.set(false);
    this.showGerantOffice.set(false);
    this.showNotifications.set(false);
  }

  toggleGerantBoutique(event: Event): void {
    event.stopPropagation();
    this.showGerantBoutique.update(v => !v);
    this.showClientEspace.set(false);
    this.showGerantOffice.set(false);
    this.showNotifications.set(false);
  }

  toggleGerantOffice(event: Event): void {
    event.stopPropagation();
    this.showGerantOffice.update(v => !v);
    this.showClientEspace.set(false);
    this.showGerantBoutique.set(false);
    this.showNotifications.set(false);
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications.update(v => !v);
    this.showClientEspace.set(false);
    this.showGerantBoutique.set(false);
    this.showGerantOffice.set(false);
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationSvc.markAllAsRead().subscribe();
  }

  unreadNotificationsCount(): number {
    return this.notificationSvc.unreadCount();
  }

  recentNotifications() {
    return this.notificationSvc.notifications().slice(0, 5);
  }

  closeEspaces(): void {
    this.showClientEspace.set(false);
    this.showGerantBoutique.set(false);
    this.showGerantOffice.set(false);
    this.showNotifications.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
