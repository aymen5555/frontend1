import { Injector, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
    });
  });

  it('should create the app', () => {
    const app = TestBed.inject(Injector).run(() => new App());
    expect(app).toBeTruthy();
  });

  it('should expose the default title', () => {
    const app = TestBed.inject(Injector).run(() => new App());
    expect((app as any).title()).toBe('frontend');
  });
});
