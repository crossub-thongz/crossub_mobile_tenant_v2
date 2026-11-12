import type { ApplicationRecord, OnboardingStatus, OnboardingStepId } from '@/src/demo/applications';
import { emptyOnboarding } from '@/src/demo/applications';
import type { Property, Thread } from '@/src/demo/model';
import type { RentReviewStatus } from '@/src/demo/tenancy-notices';
import { ApiError } from '@/src/api/http';
import {
  tenantApi,
  type ContactDto,
  type MaintenanceDto,
  type MessageDto,
  type NotificationDto,
  type OnboardingDto,
  type RentReviewDto,
  type TenancyDto,
  type VacatingDto,
} from '@/src/api/tenant';

export type LiveMaintenance = {
  id: string;
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
  buildingName: string;
  strataPlan: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  strataName: string;
  strataPhone: string;
  strataEmail: string;
};

export type LiveLedgerRow = { id: string; when: string; amount: number | null; detail: string; type: string; direction: string };
export type LiveDocument = { id: string; name: string; uploaded: string; url: string; category: string };
export type LiveInspection = { id: string; title: string; when: string; scheduledAt: string | null; status: string; address: string };
export type LiveReview = {
  id: string;
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
};
export type LiveVacating = {
  id: string;
  address: string;
  reason: string;
  vacateDate: string;
  keysReturned: boolean;
  photoUrls: string[];
  submitted: boolean;
  cleaning: string;
  bond: number;
  arrears: number;
  bills: number;
  deductions: number;
  refund: number | null;
};

export type LoadedAccount = {
  accountStatus: 'ready';
  accountError: string | null;
  ledgerConnected: boolean;
  propertyUuid: string | null;
  liveProperty: Property | null;
  rentPaidTo: string;
  paymentReference: string;
  maintenance: LiveMaintenance[];
  threads: Thread[];
  notices: { id: string; title: string; body: string; href: string; read: boolean }[];
  applications: ApplicationRecord[];
  documents: LiveDocument[];
  ledger: LiveLedgerRow[];
  inspections: LiveInspection[];
  rentReview: LiveReview | null;
  rentReviewStatus: RentReviewStatus;
  rentReviewCounter: number | null;
  vacating: LiveVacating | null;
  terminationStarted: boolean;
  terminationMoveOut: string;
  keyReturnSubmitted: boolean;
  keyReturnPhotos: string[];
  onboarding: Record<OnboardingStepId, OnboardingStatus>;
  guideSeen: boolean;
  inspectionConfirmed: boolean;
  nextRoutineAt: string | null;
  nextRentReviewAt: string | null;
  onboardingActive: boolean;
};

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

function noticeHref(href: string, type: string): string {
  const path = `${href} ${type}`.toLowerCase();
  if (path.includes('repair') || path.includes('maintenance')) return '/flow/maintenance';
  if (path.includes('message')) return '/inbox';
  if (path.includes('rent-review') || path.includes('rent_review')) return '/rent-review';
  if (path.includes('inspection')) return '/flow/inspections';
  if (path.includes('vacat') || path.includes('terminat')) return '/termination';
  if (path.includes('lease') || path.includes('document')) return '/lease';
  if (path.includes('ledger') || path.includes('rent')) return '/payments';
  if (href.startsWith('/flow') || href.startsWith('/rent-review') || href.startsWith('/lease') || href.startsWith('/inbox')) return href;
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
  if (department === 'INSPECTION') return '/flow/inspection';
  if (department === 'LEASING') return '/flow/renewal';
  if (department === 'RENT_REVIEW' && reviewId) return `/rent-review/${reviewId}`;
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
    title: (item.description || 'Repair request').slice(0, 80),
    urgent: item.urgent,
    tracking: item.orderNumber || item.id.slice(0, 8),
    photos: item.photos ?? [],
    video: '',
    status: item.status,
    category: item.categoryName || 'Repair',
    scheduleApprovalPending: Boolean(item.scheduleApprovalPending),
    scheduleProposedTimes: item.scheduleProposedTimes ?? null,
    completionApprovalPending: Boolean(item.completionApprovalPending),
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

function mapProperty(tenancy: TenancyDto): Property {
  const ended = tenancy.status === 'ENDED';
  return {
    id: 'berry',
    title: tenancy.propertyAddress || 'Your property',
    place: tenancy.propertySuburb || '',
    status: ended ? 'Previous' : 'Current',
    type: tenancy.contractType || tenancy.leaseTerm || 'Tenancy',
    start: dateLabel(tenancy.startDate),
    end: dateLabel(tenancy.endDate) || 'Periodic',
    rent: tenancy.weeklyRent ?? 0,
    frequency: tenancy.paymentCycle ? tenancy.paymentCycle[0].toUpperCase() + tenancy.paymentCycle.slice(1) : 'Weekly',
    extras: tenancy.paymentReference ? `Payment reference ${tenancy.paymentReference}` : '',
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
  ] = await Promise.all([
    settled(() => tenantApi.tenancies(), [] as TenancyDto[]),
    settled(() => tenantApi.ledger(), []),
    settled(() => tenantApi.documents(), []),
    settled(() => tenantApi.applications(), []),
    settled(() => tenantApi.maintenance(), [] as MaintenanceDto[]),
    settled(() => tenantApi.messages(), [] as MessageDto[]),
    settled(() => tenantApi.notifications(), [] as NotificationDto[]),
    settled(() => tenantApi.inspections(), []),
    settled(() => tenantApi.rentReviews(), [] as RentReviewDto[]),
    settled(() => tenantApi.vacatingCases(), [] as VacatingDto[]),
    settled(() => tenantApi.onboarding(), null as OnboardingDto | null),
    settled(() => tenantApi.welcome(), null as { acknowledged: boolean } | null),
  ]);

  const tenancy = tenancies.value.find((item) => item.status === 'ACTIVE') ?? tenancies.value[0] ?? null;
  const review = reviews.value.find((item) => item.waitingFor === 'TENANT') ?? reviews.value[0] ?? null;
  const vacatingCase = vacating.value.find((item) => item.status === 'open') ?? vacating.value[0] ?? null;
  const steps = emptyOnboarding();
  for (const step of onboarding.value?.steps ?? []) {
    if (step.id in steps) steps[step.id as OnboardingStepId] = onboardingStatus(step.status);
  }
  const settlement = vacatingCase?.repairQuoteSettlementSummary;
  const failures = [tenancies, ledger, messages, notifications].filter((item) => !item.ok).map((item) => item.error);
  const authFailed = failures.some((item) => item?.toLowerCase().includes('session') || item?.includes('401'));

  return {
    accountStatus: 'ready',
    accountError: authFailed ? 'Sign in again to load this tenancy.' : failures[0] && !tenancy ? failures[0] : null,
    ledgerConnected: ledger.ok,
    propertyUuid: tenancy?.propertyId ?? null,
    liveProperty: tenancy ? mapProperty(tenancy) : null,
    rentPaidTo: dateLabel(tenancy?.rentPaidTo),
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
    })),
    notices: notifications.value.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      href: noticeHref(item.href, item.type),
      read: item.read,
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
    })),
    documents: documents.value.map((item) => ({
      id: item.id,
      name: item.name,
      uploaded: dateLabel(item.uploadedAt),
      url: item.url,
      category: item.category,
    })),
    ledger: ledger.value.map((item) => ({
      id: item.id,
      when: dateLabel(item.occurredAt),
      amount: item.amount,
      detail: item.description || item.type,
      type: item.type,
      direction: item.direction,
    })),
    inspections: inspections.value.map((item) => ({
      id: item.id,
      title: item.type.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
      when: dateLabel(item.scheduledDate),
      scheduledAt: item.scheduledDate,
      status: item.status,
      address: item.propertyAddress || '',
    })),
    rentReview: review
      ? {
          id: review.id,
          address: review.propertyAddress || tenancy?.propertyAddress || '',
          currentRent: review.currentRentWeekly ?? 0,
          proposedRent: review.noticeTerms?.newRentWeekly ?? review.proposedRentWeekly ?? review.currentOffer?.rentAmount ?? 0,
          effective: dateLabel(review.noticeTerms?.rentIncreaseOn || review.effectiveDate),
          effectiveIso: review.noticeTerms?.rentIncreaseOn || review.effectiveDate,
          negotiable: review.rentNegotiable !== false,
          offerId: review.currentOffer?.id,
          version: review.negotiationVersion,
          counter: review.tenantCounterWeekly,
          moveOut: dateLabel(review.tenantMoveOutDate),
        }
      : null,
    rentReviewStatus: review ? reviewStatus(review) : 'pending',
    rentReviewCounter: review?.tenantCounterWeekly ?? null,
    vacating: vacatingCase
      ? {
          id: vacatingCase.id,
          address: vacatingCase.propertyAddress || '',
          reason: vacatingCase.terminationReason || 'End of lease',
          vacateDate: dateLabel(vacatingCase.vacatingDate),
          keysReturned: vacatingCase.keysReturned,
          photoUrls: vacatingCase.keyReturnPhotoUrls ?? [],
          submitted: Boolean(vacatingCase.tenantKeyReturnSubmittedAt),
          cleaning: vacatingCase.cleaningArrangement,
          bond: settlement?.bondHeld ?? tenancy?.bond ?? 0,
          arrears: settlement?.unpaidRent ?? 0,
          bills: settlement?.unpaidBills ?? 0,
          deductions: settlement?.maintenanceCost ?? 0,
          refund: settlement?.netRefund ?? vacatingCase.refundAmount,
        }
      : null,
    terminationStarted: Boolean(vacatingCase && vacatingCase.status !== 'cancelled'),
    terminationMoveOut: dateLabel(vacatingCase?.vacatingDate),
    keyReturnSubmitted: Boolean(vacatingCase?.tenantKeyReturnSubmittedAt),
    keyReturnPhotos: vacatingCase?.keyReturnPhotoUrls ?? [],
    onboarding: steps,
    guideSeen: Boolean(welcome.value?.acknowledged),
    inspectionConfirmed: inspections.value.some((item) => item.type === 'ROUTINE' && item.status !== 'CANCELLED' && item.status !== 'DRAFT'),
    nextRoutineAt:
      inspections.value.find((item) => item.type === 'ROUTINE' && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && item.scheduledDate)?.scheduledDate ??
      tenancy?.nextRoutineInspectionAt ??
      null,
    nextRentReviewAt: tenancy?.nextRentReviewAt ?? null,
    onboardingActive: Boolean(onboarding.value?.steps?.length),
  };
}
