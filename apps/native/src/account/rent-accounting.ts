import type { ScenarioId } from '@/src/demo/model';

/** Matches TenantTenancyResponseDto.accounting. The agency sets it. The tenant does not. */
export const RENT_ACCOUNTING = {
  CROSSUB_TRUST: 'crossub_trust',
  AGENT_TRUST: 'agent_trust',
  SELF_MANAGED: 'self_managed',
} as const;

export function scenarioForAccounting(value: string | null | undefined): ScenarioId | null {
  if (value === RENT_ACCOUNTING.CROSSUB_TRUST) return 'crossub';
  if (value === RENT_ACCOUNTING.AGENT_TRUST) return 'agent-trust';
  if (value === RENT_ACCOUNTING.SELF_MANAGED) return 'self-accounting';
  return null;
}
