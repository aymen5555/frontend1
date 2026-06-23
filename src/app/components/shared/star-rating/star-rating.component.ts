import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent {
  // Read-only or editable modes
  readonly = input<boolean>(false);
  
  // Two-way binding for rating value (1-5)
  rating = model<number>(0);
  
  // Custom sizing class
  sizeClass = input<string>('text-xl');

  hoveredRating = 0;

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  onStarClick(val: number): void {
    if (this.readonly()) return;
    this.rating.set(val);
  }

  onStarHover(val: number): void {
    if (this.readonly()) return;
    this.hoveredRating = val;
  }

  onStarLeave(): void {
    if (this.readonly()) return;
    this.hoveredRating = 0;
  }

  isStarred(val: number): boolean {
    const compareVal = this.hoveredRating || this.rating();
    return val <= compareVal;
  }
}
