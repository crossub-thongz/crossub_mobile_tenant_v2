import { apiJson, collectPages } from '@/src/api/http';

export type EvidenceFile = {
  fileName: string;
  mimeType: string;
  contentBase64: string;
  sizeBytes?: number;
};

type Page<T> = { items: T[]; hasMore: boolean };

export type TenancyDto = {
  id: string;
  status: string;
  contractType: string | null;
  leaseTerm: string | null;
  startDate: string | null;
  endDate: string | null;
  weeklyRent: number | null;
  bond: number | null;
  propertyId: string | null;
  propertyAddress: string | null;
  propertySuburb: string | null;
  paymentCycle: string | null;
  rentPaidTo: string | null;
  paymentReference: string | null;
  nextRoutineInspectionAt?: string | null;
  nextRentReviewAt?: string | null;
};

export type LedgerDto = {
  id: string;
  type: string;
  direction: 'IN' | 'OUT';
  amount: number | null;
  description: string | null;
  occurredAt: string | null;
};

export type DocumentDto = {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  url: string;
};

export type ApplicationDto = {
  id: string;
  reference: string;
  status: string;
  propertyId: string | null;
  propertyAddress: string | null;
  submittedAt: string;
};

export type ContactDto = { name?: string; email?: string; phone?: string };

export type MaintenanceDto = {
  id: string;
  orderNumber: string | null;
  status: string;
  urgent: boolean;
  description: string | null;
  categoryName: string | null;
  photos: string[];
  propertyAddress: string | null;
  buildingName?: string | null;
  strataPlanNumber?: string | null;
  buildingManager?: ContactDto;
  strataContact?: ContactDto;
  scheduleApprovalPending?: boolean;
  scheduleProposedTimes?: string | null;
  completionApprovalPending?: boolean;
};

export type MessageDto = {
  id: string;
  subject: string;
  department: string;
  lastMessage: string | null;
  unread: number;
  messages: { body: string; fromSelf: boolean }[];
};

export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  type: string;
};

export type InspectionDto = {
  id: string;
  type: string;
  status: string;
  propertyAddress: string | null;
  scheduledDate: string | null;
};

export type RentReviewDto = {
  id: string;
  propertyAddress: string | null;
  workflowState: string;
  currentRentWeekly: number | null;
  proposedRentWeekly: number | null;
  effectiveDate: string | null;
  rentNegotiable: boolean | null;
  tenantCounterWeekly: number | null;
  tenantMoveOutDate: string | null;
  waitingFor: string | null;
  negotiationVersion: number;
  currentOffer: { id: string; rentAmount: number } | null;
  noticeTerms: { rentIncreaseOn: string | null; newRentWeekly: number } | null;
};

export type VacatingDto = {
  id: string;
  propertyAddress: string | null;
  status: string;
  vacatingDate: string | null;
  terminationReason: string | null;
  keysReturned: boolean;
  keyReturnPhotoUrls: string[];
  tenantKeyReturnSubmittedAt: string | null;
  cleaningArrangement: string;
  refundAmount: number | null;
  debtAmount: number | null;
  repairQuoteSettlementSummary: {
    unpaidRent: number;
    unpaidBills: number;
    maintenanceCost: number;
    bondHeld: number;
    netRefund: number;
  } | null;
};

export type OnboardingStepDto = { id: string; status: string; amount?: number | null };

export type OnboardingDto = { steps: OnboardingStepDto[] };

const v1 = '/api/v1';

function pages<T>(path: string): Promise<T[]> {
  return collectPages(async (page, pageSize) => {
    const data = await apiJson<Page<T>>(`${v1}${path}?page=${page}&pageSize=${pageSize}`);
    return { items: data.items ?? [], hasMore: Boolean(data.hasMore) };
  });
}

export const tenantApi = {
  tenancies: () => pages<TenancyDto>('/tenant/tenancies'),
  ledger: () => pages<LedgerDto>('/tenant/ledger'),
  properties: () => pages<{ id: string; address: string; suburb: string | null }>('/tenant/properties'),
  documents: () => apiJson<DocumentDto[]>(`${v1}/tenant/documents`),
  applications: () => pages<ApplicationDto>('/tenant/applications'),
  maintenance: () => pages<MaintenanceDto>('/tenant/maintenance-requests'),
  messages: () => apiJson<MessageDto[]>(`${v1}/tenant/messages`),
  notifications: () => apiJson<NotificationDto[]>(`${v1}/tenant/notifications`),
  inspections: () => pages<InspectionDto>('/tenant/inspections'),
  rentReviews: () => apiJson<RentReviewDto[]>(`${v1}/tenant/rent-reviews`),
  vacatingCases: () => apiJson<VacatingDto[]>(`${v1}/tenant/vacating-cases`),
  onboarding: () => apiJson<OnboardingDto>(`${v1}/tenant/leasing/onboarding`),
  welcome: () => apiJson<{ acknowledged: boolean }>(`${v1}/tenant/onboarding/welcome`),

  uploadMaintenancePhoto: (file: EvidenceFile) =>
    apiJson<{ url: string }>(`${v1}/tenant/maintenance-requests/photos/upload`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes ?? Math.ceil((file.contentBase64.length * 3) / 4),
        contentBase64: file.contentBase64,
      }),
    }),

  createMaintenance: (body: { description: string; urgent: boolean; photos: string[]; propertyId?: string }) =>
    apiJson<{ id: string; orderNumber: string | null }>(`${v1}/tenant/maintenance-requests`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  respondSchedule: (requestId: string, decision: 'approved' | 'declined', declineReason?: string) =>
    apiJson(`${v1}/tenant/maintenance-requests/${requestId}/schedule-response`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, ...(declineReason ? { declineReason } : {}) }),
    }),

  createMessage: (body: { subject: string; body: string; department: string; propertyId?: string }) =>
    apiJson<MessageDto>(`${v1}/tenant/messages`, { method: 'POST', body: JSON.stringify(body) }),

  replyMessage: (threadId: string, body: string) =>
    apiJson<MessageDto>(`${v1}/tenant/messages/${encodeURIComponent(threadId)}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  markMessageRead: (threadId: string) =>
    apiJson(`${v1}/tenant/messages/${encodeURIComponent(threadId)}/read`, { method: 'PATCH' }),

  markNotificationRead: (id: string) =>
    apiJson(`${v1}/tenant/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),

  respondRentReview: (
    reviewId: string,
    body: {
      decision: 'accept' | 'reject' | 'counter' | 'decline';
      counterWeekly?: number;
      moveOutDate?: string;
      respondingToOfferId?: string;
      expectedVersion?: number;
    },
  ) =>
    apiJson(`${v1}/tenant/rent-reviews/${reviewId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  createVacating: (body: { expectedVacateDate: string; propertyId?: string; terminationReason?: string }) =>
    apiJson<VacatingDto>(`${v1}/tenant/vacating-cases`, { method: 'POST', body: JSON.stringify(body) }),

  uploadKeyReturnPhoto: (caseId: string, file: EvidenceFile) =>
    apiJson<{ url: string }>(`${v1}/tenant/vacating-cases/${encodeURIComponent(caseId)}/key-return/photos/upload`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes ?? Math.ceil((file.contentBase64.length * 3) / 4),
        contentBase64: file.contentBase64,
      }),
    }),

  submitKeyReturn: (caseId: string, photoUrls: string[]) =>
    apiJson(`${v1}/tenant/vacating-cases/${encodeURIComponent(caseId)}/key-return`, {
      method: 'PATCH',
      body: JSON.stringify({ photoUrls }),
    }),

  setCleaning: (caseId: string, choice: 'own_arrangement' | 'booked') =>
    apiJson(`${v1}/tenant/vacating-cases/${encodeURIComponent(caseId)}/cleaning`, {
      method: 'PATCH',
      body: JSON.stringify({ choice }),
    }),

  uploadProof: (kind: 'deposit' | 'bond', file: EvidenceFile) =>
    apiJson<{ url: string }>(`${v1}/tenant/leasing/onboarding/${kind}/proof/upload`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes ?? Math.ceil((file.contentBase64.length * 3) / 4),
        contentBase64: file.contentBase64,
      }),
    }),

  submitProof: (kind: 'deposit' | 'bond', proofUrl: string, fileName: string) =>
    apiJson(`${v1}/tenant/leasing/onboarding/${kind}/proof`, {
      method: 'PATCH',
      body: JSON.stringify({ proofUrl, fileName }),
    }),

  recordLeaseSigning: () =>
    apiJson(`${v1}/tenant/leasing/onboarding/agreement/record-signing`, { method: 'POST' }),

  acknowledgeWelcome: () =>
    apiJson(`${v1}/tenant/onboarding/welcome/acknowledge`, { method: 'POST' }),
};

export function departmentFor(category: string): string {
  if (category === 'Maintenance') return 'MAINTENANCE';
  if (category === 'Inspection') return 'INSPECTION';
  if (category === 'Leasing') return 'LEASING';
  return 'GENERAL';
}
