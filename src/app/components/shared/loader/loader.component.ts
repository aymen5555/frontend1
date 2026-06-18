import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center items-center">
      <div class="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" role="status" aria-label="Chargement"></div>
    </div>
  `,
  styles: []
})
export class LoaderComponent {}
