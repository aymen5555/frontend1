import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { SubscriptionComponent } from './subscription.component';
import { AuthService } from '../../services/auth.service';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../services/toast.service';

describe('SubscriptionComponent', () => {
  const mockAuthService = {
    isLoggedIn: () => true,
    isClient: () => true,
    currentUser: () => ({ id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com', phone: '', role: 'CLIENT', is_active: true, created_at: new Date().toISOString() }),
    navigateToHome: () => { /* mock method */ },
  };

  const mockAbonnementService = {
    getMesAbonnements: () => of([]),
    legacyConfirmPayment: () => of({}),
    legacyCancel: () => of({}),
  };

  const mockToastService = {
    success: () => {},
    error: () => {},
  };

  beforeEach(async () => {
    TestBed.overrideComponent(SubscriptionComponent, {
      set: {
        template: '<div></div>',
        styles: [],
      },
    });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AbonnementService, useValue: mockAbonnementService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SubscriptionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
