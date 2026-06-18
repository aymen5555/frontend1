import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TerrainsComponent } from './terrains.component';

describe('TerrainsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainsComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TerrainsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
