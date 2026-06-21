import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
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
  cart = inject(CartService);
  private readonly el = inject(ElementRef);

  mobileMenuOpen = signal(false);
  showClientEspace = signal(false);
  showGerantBoutique = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showClientEspace.set(false);
      this.showGerantBoutique.set(false);
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
    if (this.auth.isSuperAdmin()) return '/home';
    if (this.auth.isGerant() || this.auth.isAdmin()) return '/admin/dashboard';
    return '/home';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleClientEspace(event: Event): void {
    event.stopPropagation();
    this.showClientEspace.update(v => !v);
    this.showGerantBoutique.set(false);
  }

  toggleGerantBoutique(event: Event): void {
    event.stopPropagation();
    this.showGerantBoutique.update(v => !v);
    this.showClientEspace.set(false);
  }

  closeEspaces(): void {
    this.showClientEspace.set(false);
    this.showGerantBoutique.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
  }
}
