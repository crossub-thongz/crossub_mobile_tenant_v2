import { scenarioForAccounting } from '@/src/account/rent-accounting';
import type { ApplicationRecord, OnboardingStatus, OnboardingStepId } from '@/src/demo/applications';
import type { ScenarioId } from '@/src/demo/model';
import { emptyOnboarding } from '@/src/demo/applications';
import type { Property, Thread } from '@/src/demo/model';
import type { RentReviewStatus } from '@/src/demo/tenancy-notices';
import { ApiError } from '@/src/api/http';
import {
  tenantApi,
  type ContactDto,
  type MaintenanceDto,
  type NotificationDto,
  type OnboardingDto,
  type RentReviewDto,
  type RoutineInspectionDto,
  type VacatingDto,
  type TenancyDto,
} from '@/src/api/tenant';

export type LiveMaintenance = {
  id: string;
  propertyId: string | null;
  address: string;
  title: string;
  urgent: boolean;
  tracking: string;
  photos: string[];
  video: string;
  status: string;
  category: string;
  scheduleApprovalPending: boolean;
  scheduleProposedTimes: string | null;
  completionApprovalPending: boolean;
  responsibility: 'tenant' | 'landlord' | 'strata' | null;
  responsibilityAckRequired: boolean;
  responsibilityAckStatus: 'pending' | 'agreed' | 'disagreed' | null;
  questions: { issueId: string; questionKey: string; question: string; answer: string | null }[];
  buildingName: string;
  strataPlan: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  strataName: string;
  strataPhone: string;
  strataEmail: string;
};

export type LiveLedgerRow = { id: string; propertyId: string | null; when: string; amount: number | null; detail: string; type: string; direction: string };
export type LiveDocument = { id: string; name: string; uploaded: string; url: string; category: string };
export type LiveInspection = {
  id: string;
  propertyId: string | null;
  type: string;
  title: string;
  when: string;
  scheduledAt: string | null;
  status: string;
  address: string;
  flow: 'self' | 'in_person' | null;
  actionRequired: boolean;
  tenantAttendance: 'yes' | 'no' | null;
};
export type LiveTenancy = {
  id: string;
  propertyId: string | null;
  address: string;
  place: string;
  start: string;
  end: string;
  rent: number;
  frequency: string;
  current: boolean;
  status: string;
  accounting: 'crossub_trust' | 'agent_trust' | 'self_managed' | null;
  rentPaidTo: string;
  rentPaidToIso: string | null;
  paymentCycle: string | null;
  paymentReference: string;
  contractType: string;
};
export type LiveReview = {
  id: string;
  propertyId: string | null;
  address: string;
  currentRent: number;
  proposedRent: number;
  effective: string;
  effectiveIso: string | null;
  negotiable: boolean;
  offerId?: string;
  version: number;
  counter: number | null;
  moveOut: string;
  status: RentReviewStatus;
  requiresLeaseAgreementSign: boolean;
  leaseAgreementSigned: boolean;
  leaseAgreementPdfAvailable: boolean;
};
export type LiveVacating = {
  id: string;
  propertyId: string | null;
  status: string;
  address: string;
  reason: string;
  vacateDate: string;
  keysReturned: boolean;
  keysReturnAddress: string | null;
  photoUrls: string[];
  submitted: boolean;
  cleaning: string;
  bond: number;
  arrears: number;
  bills: number;
  deductions: number;
  refund: number | null;
  debt: number | null;
  hasSummary: boolean;
  settlementStatus: 'pending' | 'accepted' | 'declined';
  movingReferralRequestedAt: string | null;
  responsibilityStatus: 'none' | 'pending' | 'accepted' | 'declined';
  responsibilityItems: { area: string; description: string; quote: string | null; bondDeductible: boolean }[];
  repairQuoteStatus: 'pending' | 'accepted' | 'declined' | 'none';
  bondAckSent: boolean;
};

export type LiveKeyCollection = { time: string | null; location: string | null; status: string };

export type LiveRoutineAction = {
  id: string;
  flow: 'self' | 'in_person';
  status: string;
  scheduledAt: string | null;
  address: string;
  actionRequired: boolean;
};

export type LoadedAccount = {
  scenarioId: ScenarioId;
  accountingKnown: boolean;
  accountStatus: 'ready';
  accountError: string | null;
  ledgerConnected: boolean;
  propertyUuid: string | null;
  liveProperty: Property | null;
  rentPaidTo: string;
  rentPaidToIso: string | null;
  paymentCycle: string | null;
  paymentReference: string;
  maintenance: LiveMaintenance[];
  threads: Thread[];
  notices: { id: string; title: string; body: string; href: string; read: boolean; type: string }[];
  applications: ApplicationRecord[];
  documents: LiveDocument[];
  tenancies: LiveTenancy[];
  ledger: LiveLedgerRow[];
  inspections: LiveInspection[];
  rentReviews: LiveReview[];
  rentReview: LiveReview | null;
  rentReviewStatus: RentReviewStatus;
  rentReviewCounter: number | null;
  vacatingCases: LiveVacating[];
  vacating: LiveVacating | null;
  terminationStarted: boolean;
  terminationMoveOut: string;
  keyReturnSubmitted: boolean;
  keyReturnPhotos: string[];
  onboarding: Record<OnboardingStepId, OnboardingStatus>;
  onboardingAmounts: Partial<Record<OnboardingStepId, number>>;
  keyCollection: LiveKeyCollection | null;
  routineAction: LiveRoutineAction | null;
  guideSeen: boolean;
  inspectionConfirmed: boolean;
  nextRoutineAt: string | null;
  nextRentReviewAt: string | null;
  onboardingActive: boolean;
  onboardingComplete: boolean;
  onboardingStepIds: OnboardingStepId[];
  tenantName: string;
};

function streetLine(value: string | null | undefined): string {
  return (value ?? '').split(',')[0].trim().toLowerCase();
}

/** A record belongs to the selected tenancy only when its property id or street matches. A missing id is not treated as a match. */
export function sameProperty(
  record: { propertyId?: string | null; propertyAddress?: string | null; address?: string | null },
  propertyId: string | null,
  address: string,
): boolean {
  if (!propertyId && !address.trim()) return true;
  if (record.propertyId && propertyId) return record.propertyId === propertyId;
  const left = streetLine(record.propertyAddress || record.address);
  const right = streetLine(address);
  return Boolean(left) && Boolean(right) && left === right;
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function contact(value: ContactDto | undefined, fallbackName: string) {
  return {
    name: value?.name?.trim() || fallbackName,
    phone: value?.phone?.trim() || '',
    email: value?.email?.trim() || '',
  };
}

const INSPECTION_KIND = { ROUTINE: 'ROUTINE', OPEN: 'OPEN', INGOING: 'INGOING', OUTGOING: 'OUTGOING' } as const;

/** The phone screen for one inspection, matching the tenant website's inspection links. */
export function inspectionPath(type: string, id: string, selfInspectionId?: string | null): string {
  if (type === INSPECTION_KIND.INGOING) return '/flow/entry';
  if (type === INSPECTION_KIND.OUTGOING) return '/flow/final';
  if (type === INSPECTION_KIND.OPEN) return '/flow/open-inspection';
  if (type === INSPECTION_KIND.ROUTINE && selfInspectionId && id === selfInspectionId) return '/flow/self-inspection';
  return `/flow/inspection?id=${encodeURIComponent(id)}`;
}

function recordId(href: string): string | null {
  return href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}

function noticeHref(href: string, type: string): string {
  const raw = href.trim();
  const path = `${raw} ${type}`.toLowerCase();
  const id = recordId(raw);
  if (raw.startsWith('/flow') || raw.startsWith('/rent-review') || raw.startsWith('/lease') || raw.startsWith('/inbox') || raw.startsWith('/applications') || raw.startsWith('/onboarding') || raw.startsWith('/listings') || raw.startsWith('/payments') || raw.startsWith('/termination') || raw.startsWith('/statement') || raw.startsWith('/help') || raw.startsWith('/move-out-services')) {
    return raw;
  }
  if (path.includes('repair') || path.includes('maintenance')) return id ? `/flow/maintenance?job=${id}` : '/flow/maintenance';
  if (path.includes('message')) return id ? `/flow/conversation?thread=${id}` : '/inbox';
  if (path.includes('rent-review') || path.includes('rent_review')) return id ? `/rent-review/${id}` : '/rent-review';
  if (path.includes('ingoing')) return '/flow/entry';
  if (path.includes('outgoing')) return '/flow/final';
  if (path.includes('self-inspection') || path.includes('self_inspection')) return '/flow/self-inspection';
  if (path.includes('routine')) return id ? `/flow/inspection?id=${id}` : '/flow/inspection';
  if (path.includes('inspection')) return '/flow/inspections';
  if (path.includes('vacat') || path.includes('terminat')) return '/termination';
  if (path.includes('onboarding')) return '/onboarding';
  if (path.includes('application')) return id ? `/applications/${id}` : '/applications';
  if (path.includes('statement')) return '/statement';
  if (path.includes('document')) return '/flow/documents';
  if (path.includes('lease')) return '/lease';
  if (path.includes('ledger') || path.includes('accounting') || path.includes('payment') || path.includes('rent')) return '/payments';
  if (path.includes('property') || path.includes('tenancy')) return '/flow/tenancy';
  return '/flow/notifications';
}

function threadCategory(department: string): Thread['category'] {
  if (department === 'MAINTENANCE') return 'Maintenance';
  if (department === 'INSPECTION') return 'Inspection';
  if (department === 'LEASING' || department === 'RENT_REVIEW') return 'Leasing';
  return 'General';
}

function caseRoute(department: string, reviewId: string | null): string | undefined {
  if (department === 'MAINTENANCE') return '/flow/maintenance';
  if (department === 'INSPECTION') return '/flow/inspections';
  if (department === 'RENT_REVIEW' && reviewId) return `/rent-review/${reviewId}`;
  if (department === 'ACCOUNTING') return '/payments';
  return undefined;
}

function applicationStatus(status: string): ApplicationRecord['status'] {
  if (status === 'APPROVED' || status === 'LEASED') return 'approved';
  if (status === 'DECLINED' || status === 'WITHDRAWN') return 'declined';
  if (status === 'DRAFT') return 'missing_information';
  return 'submitted';
}

function onboardingStatus(status: string): OnboardingStatus {
  if (status === 'done') return 'completed';
  if (status === 'in_progress' || status === 'waiting' || status === 'blocked') return 'uploaded';
  return 'pending';
}

function reviewStatus(review: RentReviewDto): RentReviewStatus {
  if (review.workflowState === 'TENANT_ACCEPTED' || review.workflowState === 'COMPLETED' || review.workflowState === 'ACCOUNTING') return 'accepted';
  if (review.workflowState === 'NEGOTIATION') return 'countered';
  if (review.workflowState === 'TENANT_REJECTED') return 'vacating';
  return 'pending';
}

function mapMaintenance(item: MaintenanceDto): LiveMaintenance {
  const manager = contact(item.buildingManager, '');
  const strata = contact(item.strataContact, '');
  return {
    id: item.id,
    propertyId: item.propertyId ?? null,
    address: item.propertyAddress || '',
    title: item.description || 'Repair request',
    urgent: item.urgent,
    tracking: item.orderNumber || item.id.slice(0, 8),
    photos: item.photos ?? [],
    video: '',
    status: item.status,
    category: item.categoryName || 'Repair',
    scheduleApprovalPending: Boolean(item.scheduleApprovalPending),
    scheduleProposedTimes: item.scheduleProposedTimes ?? null,
    completionApprovalPending: Boolean(item.completionApprovalPending),
    responsibility: item.responsibility ?? null,
    responsibilityAckRequired: Boolean(item.responsibilityAckRequired),
    responsibilityAckStatus: item.responsibilityAckStatus ?? null,
    questions: (item.questions ?? []).map((question) => ({
      issueId: question.issueId,
      questionKey: question.questionKey,
      question: question.question,
      answer: question.answer,
    })),
    buildingName: item.buildingName || '',
    strataPlan: item.strataPlanNumber || '',
    managerName: manager.name,
    managerPhone: manager.phone,
    managerEmail: manager.email,
    strataName: strata.name,
    strataPhone: strata.phone,
    strataEmail: strata.email,
  };
}

const CURRENT_TENANCY = new Set(['ACTIVE', 'SIGNED', 'PARTIALLY_SIGNED', 'SENT']);

function tenancyFrequency(cycle: string | null): string {
  if (!cycle) return 'Weekly';
  return cycle[0].toUpperCase() + cycle.slice(1);
}

function mapTenancy(tenancy: TenancyDto): LiveTenancy {
  return {
    id: tenancy.id,
    propertyId: tenancy.propertyId,
    address: tenancy.propertyAddress || 'Your property',
    place: tenancy.propertySuburb || '',
    start: dateLabel(tenancy.startDate),
    end: dateLabel(tenancy.endDate) || 'Periodic',
    rent: tenancy.weeklyRent ?? 0,
    frequency: tenancyFrequency(tenancy.paymentCycle),
    current: CURRENT_TENANCY.has(tenancy.status),
    status: tenancy.status,
    accounting: tenancy.accounting ?? null,
    rentPaidTo: dateLabel(tenancy.rentPaidTo),
    rentPaidToIso: tenancy.rentPaidTo,
    paymentCycle: tenancy.paymentCycle,
    paymentReference: tenancy.paymentReference || '',
    contractType: tenancy.contractType || tenancy.leaseTerm || 'Tenancy',
  };
}

function mapProperty(tenancy: TenancyDto): Property {
  const row = mapTenancy(tenancy);
  return {
    id: 'berry',
    title: row.address,
    place: row.place,
    status: row.current ? 'Current' : 'Previous',
    type: tenancy.contractType || tenancy.leaseTerm || 'Tenancy',
    start: row.start,
    end: row.end,
    rent: row.rent,
    frequency: row.frequency,
    extras: '',
  };
}

async function settled<T>(run: () => Promise<T>, fallback: T): Promise<{ value: T; ok: boolean; error: string | null }> {
  try {
    return { value: await run(), ok: true, error: null };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Request failed';
    return { value: fallback, ok: false, error: message };
  }
}

const ONBOARDING_STEP = {
  DEPOSIT: 'deposit',
  BOND: 'bond',
  LEASE: 'lease_signing',
  KEYS: 'key_pickup',
  ACCOUNT: 'account_setup',
  INGOING: 'ingoing_report',
} as const;

const ONBOARDING_STEP_IDS = new Set<string>(Object.values(ONBOARDING_STEP));

function isOnboardingStep(id: string): id is OnboardingStepId {
  return ONBOARDING_STEP_IDS.has(id);
}

const ROUTINE_FLOW = { SELF: 'self', IN_PERSON: 'in_person' } as const;
const ROUTINE_DONE = new Set(['completed', 'cancelled']);
const TENANCY_ACTIVE = 'ACTIVE';

function mapRoutineInspection(item: RoutineInspectionDto): LiveInspection {
  return {
    id: item.id,
    propertyId: item.propertyId,
    type: INSPECTION_KIND.ROUTINE,
    title: item.flow === ROUTINE_FLOW.SELF ? 'Self inspection' : 'Routine inspection',
    when: dateLabel(item.scheduledAt),
    scheduledAt: item.scheduledAt,
    status: item.status,
    address: item.propertyAddress || '',
    flow: item.flow,
    actionRequired: item.tenantActionRequired,
    tenantAttendance: item.tenantAttendance === 'yes' || item.tenantAttendance === 'no' ? item.tenantAttendance : null,
  };
}

function mapReview(review: RentReviewDto, fallbackAddress: string): LiveReview {
  return {
    id: review.id,
    propertyId: review.propertyId,
    address: review.propertyAddress || fallbackAddress,
    currentRent: review.currentRentWeekly ?? 0,
    proposedRent: review.noticeTerms?.newRentWeekly ?? review.proposedRentWeekly ?? review.currentOffer?.rentAmount ?? 0,
    effective: dateLabel(review.noticeTerms?.rentIncreaseOn || review.effectiveDate),
    effectiveIso: review.noticeTerms?.rentIncreaseOn || review.effectiveDate,
    negotiable: review.rentNegotiable !== false,
    offerId: review.currentOffer?.id,
    version: review.negotiationVersion,
    counter: review.tenantCounterWeekly,
    moveOut: dateLabel(review.tenantMoveOutDate),
    status: reviewStatus(review),
    requiresLeaseAgreementSign: review.noticeTerms?.requiresLeaseAgreementSign === true,
    leaseAgreementSigned: review.noticeTerms?.leaseAgreementSigned === true,
    leaseAgreementPdfAvailable: review.noticeTerms?.leaseAgreementPdfAvailable === true,
  };
}

function mapVacating(vacatingCase: VacatingDto, bond: number): LiveVacating {
  const settlement = vacatingCase.repairQuoteSettlementSummary;
  return {
    id: vacatingCase.id,
    propertyId: vacatingCase.propertyId,
    status: vacatingCase.status,
    address: vacatingCase.propertyAddress || '',
    reason: vacatingCase.terminationReason || 'End of lease',
    vacateDate: dateLabel(vacatingCase.vacatingDate),
    keysReturned: vacatingCase.keysReturned,
    keysReturnAddress: vacatingCase.keysReturnAddress,
    photoUrls: vacatingCase.keyReturnPhotoUrls ?? [],
    submitted: Boolean(vacatingCase.tenantKeyReturnSubmittedAt),
    cleaning: vacatingCase.cleaningArrangement,
    bond: settlement?.bondHeld ?? bond,
    arrears: settlement?.unpaidRent ?? 0,
    bills: settlement?.unpaidBills ?? 0,
    deductions: settlement?.maintenanceCost ?? 0,
    refund: settlement?.netRefund ?? vacatingCase.refundAmount,
    debt: settlement?.debtAmount ?? vacatingCase.debtAmount,
    hasSummary: Boolean(settlement),
    movingReferralRequestedAt: vacatingCase.movingReferralRequestedAt,
    settlementStatus: vacatingCase.tenantSettlementStatus,
    responsibilityStatus: vacatingCase.tenantResponsibilityReviewStatus ?? 'none',
    responsibilityItems: (vacatingCase.tenantResponsibilityItems ?? []).map((item) => ({
      area: item.area,
      description: item.description,
      quote: item.quote ?? null,
      bondDeductible: item.bondDeductible === true,
    })),
    repairQuoteStatus: vacatingCase.tenantRepairQuoteStatus ?? 'none',
    bondAckSent: Boolean(vacatingCase.tenantBondAckSentAt),
  };
}

export function propertyFromTenancy(tenancy: LiveTenancy): Property {
  return {
    id: 'berry',
    title: tenancy.address,
    place: tenancy.place,
    status: tenancy.current ? 'Current' : 'Previous',
    type: tenancy.contractType,
    start: tenancy.start,
    end: tenancy.end,
    rent: tenancy.rent,
    frequency: tenancy.frequency,
    extras: '',
  };
}

export function scopeAccount(input: {
  tenancies: LiveTenancy[];
  selectedTenancyId: string | null;
  maintenance: LiveMaintenance[];
  inspections: LiveInspection[];
  ledger: LiveLedgerRow[];
  rentReviews: LiveReview[];
  vacatingCases: LiveVacating[];
}) {
  const selected =
    input.tenancies.find((item) => item.id === input.selectedTenancyId) ??
    input.tenancies.find((item) => item.status === TENANCY_ACTIVE) ??
    input.tenancies.find((item) => item.current) ??
    input.tenancies[0] ??
    null;
  const propertyId = selected?.propertyId ?? null;
  const propertyAddress = selected?.address ?? '';
  const matches = (id: string | null | undefined, address = '') =>
    sameProperty({ propertyId: id, address }, propertyId, propertyAddress);
  const matchesRepair = (item: LiveMaintenance) =>
    sameProperty({ propertyId: item.propertyId, address: item.address }, propertyId, propertyAddress);
  const inspections = input.inspections.filter((item) => matches(item.propertyId, item.address));
  const openRoutine =
    inspections.find((item) => item.type === INSPECTION_KIND.ROUTINE && item.actionRequired && !ROUTINE_DONE.has(item.status)) ??
    inspections.find((item) => item.type === INSPECTION_KIND.ROUTINE && !ROUTINE_DONE.has(item.status)) ??
    null;
  const review = propertyId ? input.rentReviews.find((item) => item.propertyId === propertyId) ?? null : input.rentReviews[0] ?? null;
  const vacating = propertyId
    ? input.vacatingCases.find((item) => item.propertyId === propertyId && item.status === 'open') ??
      input.vacatingCases.find((item) => item.propertyId === propertyId) ??
      null
    : input.vacatingCases.find((item) => item.status === 'open') ?? input.vacatingCases[0] ?? null;
  const accounting = scenarioForAccounting(selected?.accounting);
  return {
    scenarioId: accounting ?? 'crossub',
    accountingKnown: accounting !== null,
    propertyUuid: propertyId,
    liveProperty: selected ? propertyFromTenancy(selected) : null,
    rentPaidTo: selected?.rentPaidTo ?? '',
    rentPaidToIso: selected?.rentPaidToIso ?? null,
    paymentCycle: selected?.paymentCycle ?? null,
    paymentReference: selected?.paymentReference ?? '',
    maintenance: input.maintenance.filter(matchesRepair),
    maintenanceAll: input.maintenance,
    inspections,
    ledger: input.ledger.filter((item) => matches(item.propertyId)),
    rentReview: review,
    rentReviewStatus: review?.status ?? 'pending',
    rentReviewCounter: review?.counter ?? null,
    rentReviewMoveOut: review?.moveOut ?? '',
    vacating,
    terminationStarted: Boolean(vacating && vacating.status !== 'cancelled'),
    terminationMoveOut: vacating?.vacateDate ?? '',
    keyReturnSubmitted: Boolean(vacating?.submitted),
    keyReturnPhotos: vacating?.photoUrls ?? [],
    routineAction: openRoutine
      ? {
          id: openRoutine.id,
          flow: openRoutine.flow === ROUTINE_FLOW.SELF ? ROUTINE_FLOW.SELF : ROUTINE_FLOW.IN_PERSON,
          status: openRoutine.status,
          scheduledAt: openRoutine.scheduledAt,
          address: openRoutine.address,
          actionRequired: openRoutine.actionRequired,
        }
      : null,
    nextRoutineAt: openRoutine?.scheduledAt ?? null,
  };
}

export async function loadAccount(): Promise<LoadedAccount> {
  const [
    tenancies,
    ledger,
    documents,
    applications,
    maintenance,
    messages,
    notifications,
    inspections,
    reviews,
    vacating,
    onboarding,
    welcome,
    routines,
  ] = await Promise.all([
    settled(() => tenantApi.tenancies(), [] as Awaited<ReturnType<typeof tenantApi.tenancies>>),
    settled(() => tenantApi.ledger(), []),
    settled(() => tenantApi.documents(), []),
    settled(() => tenantApi.applications(), []),
    settled(() => tenantApi.maintenance(), [] as Awaited<ReturnType<typeof tenantApi.maintenance>>),
    settled(() => tenantApi.messages(), [] as Awaited<ReturnType<typeof tenantApi.messages>>),
    settled(() => tenantApi.notifications(), [] as NotificationDto[]),
    settled(() => tenantApi.inspections(), []),
    settled(() => tenantApi.rentReviews(), [] as RentReviewDto[]),
    settled(() => tenantApi.vacatingCases(), []),
    settled(() => tenantApi.onboarding(), null as OnboardingDto | null),
    settled(() => tenantApi.welcome(), null as { acknowledged: boolean } | null),
    settled(() => tenantApi.routineInspections(), [] as RoutineInspectionDto[]),
  ]);

  const tenancy = tenancies.value.find((item) => item.status === 'ACTIVE') ?? tenancies.value[0] ?? null;
  const review = reviews.value.find((item) => item.waitingFor === 'TENANT') ?? reviews.value[0] ?? null;
  const vacatingCase = vacating.value.find((item) => item.status === 'open') ?? vacating.value[0] ?? null;
  const steps = emptyOnboarding();
  const onboardingAmounts: Partial<Record<OnboardingStepId, number>> = {};
  for (const step of onboarding.value?.steps ?? []) {
    if (step.id in steps) steps[step.id as OnboardingStepId] = onboardingStatus(step.status);
    if (typeof step.amount === 'number') onboardingAmounts[step.id as OnboardingStepId] = step.amount;
  }
  const routineList = Array.isArray(routines.value) ? routines.value : [];
  const routineNeedingAction = routineList.find((item) => item.tenantActionRequired) ?? null;
  const key = onboarding.value?.keyCollection;
  const failures = [tenancies, ledger, messages, notifications].filter((item) => !item.ok).map((item) => item.error);
  const authFailed = failures.some((item) => item?.toLowerCase().includes('session') || item?.includes('401'));
  const accounting = scenarioForAccounting(tenancy?.accounting);
  const profile = await settled(() => tenantApi.profile(), null);
  const tenantName = [profile.value?.firstName, profile.value?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return {
    scenarioId: accounting ?? 'crossub',
    accountingKnown: accounting !== null,
    accountStatus: 'ready',
    accountError: authFailed ? 'Sign in again to load this tenancy.' : failures[0] && !tenancy ? failures[0] : null,
    ledgerConnected: ledger.ok,
    propertyUuid: tenancy?.propertyId ?? null,
    liveProperty: tenancy ? mapProperty(tenancy) : null,
    rentPaidTo: dateLabel(tenancy?.rentPaidTo),
    rentPaidToIso: tenancy?.rentPaidTo ?? null,
    paymentCycle: tenancy?.paymentCycle ?? null,
    paymentReference: tenancy?.paymentReference || '',
    maintenance: maintenance.value.map(mapMaintenance),
    threads: messages.value.map((item) => ({
      id: item.id,
      category: threadCategory(item.department),
      subject: item.subject,
      preview: item.lastMessage || item.messages.at(-1)?.body || '',
      status: 'Open',
      route: `/flow/conversation?thread=${item.id}`,
      caseRoute: caseRoute(item.department, review?.id ?? null),
      unread: item.unread > 0,
      lastAt: item.lastAt || item.messages.at(-1)?.at || null,
      messages: item.messages.map((message) => ({
        body: message.body,
        fromSelf: message.fromSelf,
        at: message.at,
        attachments: message.attachments?.map((file) => ({ fileName: file.fileName, url: file.url })),
      })),
    })),
    notices: notifications.value.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      href: noticeHref(item.href, item.type),
      read: item.read,
      type: item.type,
    })),
    applications: applications.value.map((item) => ({
      id: item.id,
      reference: item.reference,
      propertyId: item.propertyId || '',
      propertyAddress: item.propertyAddress || 'Property',
      status: applicationStatus(item.status),
      submittedAt: dateLabel(item.submittedAt),
      applicantName: '',
      email: '',
      phone: '',
      leaseTerm: '',
      occupants: '',
      employment: '',
      documents: [],
      missingDocuments: [],
      isRenewal: item.isRenewal,
    })),
    documents: documents.value.map((item) => ({
      id: item.id,
      name: item.name,
      uploaded: dateLabel(item.uploadedAt),
      url: item.url,
      category: item.category,
    })),
    tenancies: tenancies.value.map(mapTenancy),
    ledger: ledger.value.map((item) => ({
      id: item.id,
      propertyId: item.propertyId,
      when: dateLabel(item.occurredAt),
      amount: item.amount,
      detail: item.description || item.type,
      type: item.type,
      direction: item.direction,
    })),
    inspections: [
      ...routineList.map(mapRoutineInspection),
      ...inspections.value.map((item) => ({
        id: item.id,
        propertyId: item.propertyId,
        type: item.type,
        title: item.type.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
        when: dateLabel(item.scheduledDate),
        scheduledAt: item.scheduledDate,
        status: item.status,
        address: item.propertyAddress || '',
        flow: null,
        actionRequired: false,
        tenantAttendance: null,
      })),
    ],
    rentReviews: reviews.value.map((item) => mapReview(item, tenancy?.propertyAddress || '')),
    rentReview: review ? mapReview(review, tenancy?.propertyAddress || '') : null,
    rentReviewStatus: review ? reviewStatus(review) : 'pending',
    rentReviewCounter: review?.tenantCounterWeekly ?? null,
    vacatingCases: vacating.value.map((item) => mapVacating(item, tenancy?.bond ?? 0)),
    vacating: vacatingCase ? mapVacating(vacatingCase, tenancy?.bond ?? 0) : null,
    terminationStarted: Boolean(vacatingCase && vacatingCase.status !== 'cancelled'),
    terminationMoveOut: dateLabel(vacatingCase?.vacatingDate),
    keyReturnSubmitted: Boolean(vacatingCase?.tenantKeyReturnSubmittedAt),
    keyReturnPhotos: vacatingCase?.keyReturnPhotoUrls ?? [],
    onboarding: steps,
    onboardingAmounts,
    keyCollection: key
      ? { time: key.time, location: key.location, status: key.status }
      : null,
    routineAction: routineNeedingAction
      ? {
          id: routineNeedingAction.id,
          flow: routineNeedingAction.flow === 'self' ? 'self' : 'in_person',
          status: routineNeedingAction.status,
          scheduledAt: routineNeedingAction.scheduledAt,
          address: routineNeedingAction.propertyAddress || '',
          actionRequired: true,
        }
      : null,
    guideSeen: Boolean(welcome.value?.acknowledged),
    inspectionConfirmed: inspections.value.some((item) => item.type === 'ROUTINE' && item.status !== 'CANCELLED' && item.status !== 'DRAFT'),
    nextRoutineAt:
      routineNeedingAction?.scheduledAt ??
      routineList.find((item) => item.status !== 'completed' && item.scheduledAt)?.scheduledAt ??
      inspections.value.find((item) => item.type === 'ROUTINE' && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && item.scheduledDate)?.scheduledDate ??
      tenancy?.nextRoutineInspectionAt ??
      null,
    nextRentReviewAt: tenancy?.nextRentReviewAt ?? null,
    onboardingActive: Boolean(onboarding.value?.steps?.length) && onboarding.value?.onboardingComplete !== true,
    onboardingComplete: onboarding.value?.onboardingComplete === true || Boolean(onboarding.error?.toLowerCase().includes('complete')),
    onboardingStepIds: (onboarding.value?.steps ?? []).map((step) => step.id).filter(isOnboardingStep),
    tenantName,
  };
}
