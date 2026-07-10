import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { ActivitesComponent } from '../app/pages/activites/activites.component';
import { ActiviteService } from '../app/services/activite.service';
import { ComplexeService } from '../app/services/complexe.service';
import { ToastService } from '../app/services/toast.service';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';

describe('ActivitesComponent', () => {
  let component: ActivitesComponent;
  let mockActiviteService: any;
  let mockComplexeService: any;
  let mockToast: any;

  beforeEach(() => {
    mockActiviteService = {
      getAll: vi.fn(() => of([])),
      getPlaces: vi.fn(() => of({ places_restantes: 0, booked: 0, user_conflict: false })),
      reserver: vi.fn(() => of({ id: 1 })),
      payReservation: vi.fn(() => of({})),
      cancelReservation: vi.fn(() => of(void 0)),
    };

    mockComplexeService = { getAll: vi.fn(() => of([])) };
    mockToast = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const mockRouter = { navigate: vi.fn() };

    const mockAuthService = { isLoggedIn: () => true, user: () => ({ id: 1 }) };
    const injector = createEnvironmentInjector([
      { provide: ActiviteService, useValue: mockActiviteService },
      { provide: ComplexeService, useValue: mockComplexeService },
      { provide: ToastService, useValue: mockToast },
      { provide: AuthService, useValue: mockAuthService },
      { provide: Router, useValue: mockRouter },
    ]);

    component = runInInjectionContext(injector, () => new ActivitesComponent());
  });

  it('keeps a pending activity reservation when payment modal is cancelled', () => {
    component.showPaymentModal.set(true);
    component.paymentReservationId.set(123);
    component.bookingInProgress.set(true);
    component.showPanel.set(true);

    component.onPaymentModalCancelled();

    expect(component.showPaymentModal()).toBe(false);
    expect(component.paymentReservationId()).toBe(null);
    expect(component.bookingInProgress()).toBe(false);
    expect(component.showPanel()).toBe(false);
    expect(mockActiviteService.cancelReservation).not.toHaveBeenCalled();
    expect(mockToast.warning).toHaveBeenCalledWith(
      'Paiement non effectué. Votre réservation est conservée en attente de paiement dans Mes Activités.'
    );
  });
});
