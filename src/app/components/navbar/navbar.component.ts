import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  auth = inject(AuthService);
  mobileMenuOpen = signal(false);
  showEspace = signal(false);

  get initials(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  }

  getHomeRoute(): string {
    if (!this.auth.isLoggedIn()) return '/';
    if (this.auth.isSuperAdmin()) return '/home';
    if (this.auth.isGerant() || this.auth.isAdmin()) return '/admin/dashboard';
    return '/home';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleEspace(): void {
    this.showEspace.update(v => !v);
  }

  closeEspace(): void {
    this.showEspace.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
