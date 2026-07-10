import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('renders complexe discount text', () => {
    const discount = 20;
    const text = `Devenez adhérent et économisez ${discount}% sur toutes vos réservations`;
    expect(text).toContain(`${discount}%`);
  });
});
