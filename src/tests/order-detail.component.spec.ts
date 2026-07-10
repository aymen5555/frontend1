import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { OrderDetailComponent } from '../app/features/orders/order-detail/order-detail.component';
import { OrderService } from '../app/services/order.service';
import { ToastService } from '../app/services/toast.service';
import { ReviewService } from '../app/services/review.service';
import { AuthService } from '../app/services/auth.service';

const MOCK_ORDER = {
  id: 1,
  montant_total: 120.0,
  montant_paye: 20.0,
  reglements: [
    { id: 1, montant: 10.0, reference: 'REF1', modalite: 'especes', created_at: new Date().toISOString() },
    { id: 2, montant: 10.0, reference: 'REF2', modalite: 'carte', created_at: new Date().toISOString() }
  ],
  lignes: [],
  statut: 'en_attente',
  statut_paiement: 'partiel',
  modalite_paiement: 'especes',
  created_at: new Date().toISOString(),
  complexe: { name: 'C', address: 'Rue Test' }
} as any;

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;

  beforeEach(() => {
    const mockOrderService = {
      getMyOrderDetail: () => of({ data: MOCK_ORDER })
    };
    const mockToast = { error: () => {}, success: () => {} };
    const mockReview = { getEligibility: () => of({ already_rated: false }), submitProductReview: () => of({}) };
    const mockAuth = { user: null };
    const mockActivatedRoute = { snapshot: { paramMap: { get: () => '1' } } } as ActivatedRoute;
    const mockRouter = { navigate: () => {} } as Router;

    const injector = createEnvironmentInjector([
      { provide: OrderService, useValue: mockOrderService },
      { provide: ToastService, useValue: mockToast },
      { provide: ReviewService, useValue: mockReview },
      { provide: AuthService, useValue: mockAuth },
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: Router, useValue: mockRouter }
    ]);

    component = runInInjectionContext(injector, () => new OrderDetailComponent());
  });

  it('loads order detail and exposes reglement history', () => {
    component.loadOrderDetail(1);

    expect(component.order()?.montant_paye).toBe(20.0);
    expect(component.order()?.reglements.length).toBe(2);
    expect(component.order()?.reglements[0].reference).toBe('REF1');
    expect(component.getPaymentLabel('paye')).toBe('Payé');
    expect(component.getStatusLabel('en_attente')).toBe('En Attente');
  });
});
