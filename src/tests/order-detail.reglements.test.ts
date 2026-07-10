import { describe, it, expect } from 'vitest';

describe('Order model — reglements', () => {
  it('contains reglement items and paid amount', () => {
    const MOCK_ORDER = {
      id: 1,
      montant_total: 120.0,
      montant_paye: 20.0,
      reglements: [
        { id: 1, montant: 10.0, reference: 'REF1', modalite: 'especes', created_at: new Date().toISOString() },
        { id: 2, montant: 10.0, reference: 'REF2', modalite: 'carte', created_at: new Date().toISOString() }
      ]
    } as any;

    expect(Array.isArray(MOCK_ORDER.reglements)).toBe(true);
    expect(MOCK_ORDER.reglements.length).toBe(2);
    expect(MOCK_ORDER.reglements.map((r: any) => r.reference)).toEqual(['REF1', 'REF2']);
    expect(MOCK_ORDER.montant_paye).toBeCloseTo(20.0);
  });
});
