import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TerrainsComponent } from './terrains.component';
import { TerrainService } from '../../services/terrain.service';
import { ComplexeService } from '../../services/complexe.service';
import { ReservationService } from '../../services/reservation.service';
import { of } from 'rxjs';

describe('TerrainsComponent', () => {
  const mockTerrainService = {
    list: () => of([]),
    getSlots: () => of([]),
  };

  const mockComplexeService = {
    list: () => of([]),
  };

  const mockReservationService = {
    create: () => of(null),
  };

  beforeEach(async () => {
    TestBed.overrideComponent(TerrainsComponent, {
      set: {
        template: '<div></div>',
        styles: [],
      },
    });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: TerrainService, useValue: mockTerrainService },
        { provide: ComplexeService, useValue: mockComplexeService },
        { provide: ReservationService, useValue: mockReservationService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TerrainsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
