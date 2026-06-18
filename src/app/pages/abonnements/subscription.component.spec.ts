import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SubscriptionComponent } from './subscription.component';
import { AuthService } from '../../services/auth.service';
import { AbonnementService } from '../../services/abonnement.service';

describe('SubscriptionComponent', () => {
  const mockAuthService = {
    isLoggedIn: () => true,
    isClient: () => true,
    currentUser: () => ({ id: 1, first_name: 'Test', last_name: 'User', email: 'test@example.com', phone: '', role: 'CLIENT', is_active: true, created_at: new Date().toISOString() }),
    navigateToHome: () => { /* mock method */ },
  };

  const mockAbonnementService = {
    getMine: () => of([]),
    create: () => of({ id: 1, user_id: 1, type: 'MONTHLY', status: 'pending', payment_method: 'carte', payment_status: 'pending', price: 49, start_at: new Date().toISOString(), expires_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    confirmPayment: () => of({}),
    cancel: () => of({}),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }, { provide: AbonnementService, useValue: mockAbonnementService }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SubscriptionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
