export type PaymentCycle = 'weekly' | 'fortnightly' | 'monthly';

export function normalizeCycle(raw?: string | null): PaymentCycle {
  const value = raw?.trim().toLowerCase();
  if (value === 'fortnightly' || value === 'monthly') return value;
  return 'weekly';
}

/** One rent payment at the tenancy's cycle, from the weekly rent on the lease. */
export function cycleAmount(weekly: number, cycle: PaymentCycle): number {
  if (!weekly || weekly <= 0) return 0;
  if (cycle === 'weekly') return Math.round(weekly * 100) / 100;
  if (cycle === 'fortnightly') return Math.round(weekly * 2 * 100) / 100;
  return Math.round(((weekly * 52) / 12) * 100) / 100;
}

export function cycleUnit(cycle: PaymentCycle): string {
  if (cycle === 'monthly') return 'month';
  if (cycle === 'fortnightly') return 'fortnight';
  return 'week';
}

export type RentArrears = {
  outstanding: number;
  paidToLabel: string;
  periods: number;
  unit: string;
};

/**
 * Overdue rent from the paid-to date on the tenancy.
 * Hidden when that date is missing or still current — the ledger lines do not carry an outstanding amount.
 */
export function arrearsFromPaidTo(input: {
  rentPaidToIso: string | null;
  weeklyRent: number;
  paymentCycle: string | null;
  paidToLabel: string;
}): RentArrears | null {
  if (!input.rentPaidToIso || input.weeklyRent <= 0) return null;
  const paid = new Date(input.rentPaidToIso);
  if (Number.isNaN(paid.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  paid.setHours(0, 0, 0, 0);
  if (paid.getTime() >= today.getTime()) return null;
  const cycle = normalizeCycle(input.paymentCycle);
  const days = Math.round((today.getTime() - paid.getTime()) / 86_400_000);
  const cycleDays = cycle === 'monthly' ? 30 : cycle === 'fortnightly' ? 14 : 7;
  const periods = Math.max(1, Math.ceil(days / cycleDays));
  const unit = cycleUnit(cycle);
  const paidToLabel =
    input.paidToLabel ||
    paid.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  return {
    outstanding: Math.round(periods * cycleAmount(input.weeklyRent, cycle) * 100) / 100,
    paidToLabel,
    periods,
    unit,
  };
}
