import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="text-9xl font-black text-gray-200 mb-4">404</div>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-3">Page introuvable</h1>
        <p class="text-gray-500 mb-8 text-lg">
          Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/" class="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-sm">
            <span class="mr-2">🏠</span> Retour à l'accueil
          </a>
          <a routerLink="/terrains" class="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 hover:border-emerald-500 text-gray-700 hover:text-emerald-600 rounded-xl font-bold transition-colors">
            <span class="mr-2">🎾</span> Réserver un terrain
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotFoundComponent {}
