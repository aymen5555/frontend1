import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SubscriptionAdminComponent } from '../app/components/subscriptions/admin/subscription-admin.component';
import { AuthService } from '../app/services/auth.service';
import { AbonnementService } from '../app/services/abonnement.service';
import { ComplexeService } from '../app/services/complexe.service';
import { ToastService } from '../app/services/toast.service';

describe('SubscriptionAdminComponent', () => {
  let component: SubscriptionAdminComponent;
  let mockAbonnementService: any;

  beforeEach(async () => {
    mockAbonnementService = {
      adminGetTypes: vi.fn(() => of([])),
      adminGetAbonnements: vi.fn(() => of([
        {
          id: 1,
          paye: false,
          reste_a_payer: 100,
          statut: 'en_attente',
        },
      ])),
      adminStats: vi.fn(() => of({ total_abonnements: 1 })),
      getAbonnementDetail: vi.fn(() => of({ reglements: [{ id: 1, montant: 50, modalite: 'especes', reference: 'REF1', date_reglement: new Date().toISOString() }] })),
      adminConfirmPayment: vi.fn(() => of({ id: 1, paye: true, reste_a_payer: 0, statut: 'paye' })),
    };

    const mockComplexeService = { getAll: vi.fn(() => of([])) };
    const mockAuthService = {
      user: () => ({ complexe: null }),
      isSuperAdmin: () => false,
      isGerant: () => false,
    };
    const mockToast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SubscriptionAdminComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: AbonnementService, useValue: mockAbonnementService },
        { provide: ComplexeService, useValue: mockComplexeService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubscriptionAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('opens payment history modal and loads reglements', async () => {
    const abonnement = { id: 1, reste_a_payer: 100 } as any;
    component.openReglementsModal(abonnement);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockAbonnementService.getAbonnementDetail).toHaveBeenCalledWith(1);
    expect(component.reglements.length).toBe(1);
    expect(component.reglements[0].reference).toBe('REF1');
    expect(component.loadingReglements).toBe(false);
    expect(component.reglementsModalVisible).toBe(true);
  });

  it('saves a new reglement and refreshes subscription data', async () => {
    component.selectedAbonnement = { id: 1 } as any;
    component.paymentForm.setValue({ montant: 50, modalite_paiement: 'especes', reference: 'REF1' });

    component.createReglement();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockAbonnementService.adminConfirmPayment).toHaveBeenCalledWith(1, {
      montant: 50,
      modalite_paiement: 'especes',
      reference: 'REF1',
    });
    expect(mockAbonnementService.getAbonnementDetail).toHaveBeenCalledTimes(1);
    expect(component.reglements[0].reference).toBe('REF1');
  });
});