import type { components } from '@crossub-thongz/api-contract';

import { crossub, unwrap } from '@/src/api/client';
import { collectPages } from '@/src/api/http';

type Department = components['schemas']['CreateTenantMessageThreadDto']['department'];

export type EvidenceFile = {
  fileName: string;
  mimeType: string;
  contentBase64: string;
  sizeBytes?: number;
  /** Local file URI used only to draw a thumbnail. The upload still sends contentBase64. */
  previewUri?: string;
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
  accounting?: 'crossub_trust' | 'agent_trust' | 'self_managed' | null;
};

export type LedgerDto = {
  id: string;
  type: string;
  direction: 'IN' | 'OUT';
  amount: number | null;
  description: string | null;
  occurredAt: string | null;
  propertyId: string | null;
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
  propertyId?: string | null;
  propertyAddress: string | null;
  buildingName?: string | null;
  strataPlanNumber?: string | null;
  buildingManager?: ContactDto;
  strataContact?: ContactDto;
  scheduleApprovalPending?: boolean;
  scheduleProposedTimes?: string | null;
  completionApprovalPending?: boolean;
  responsibility?: 'tenant' | 'landlord' | 'strata' | null;
  responsibilityAckRequired?: boolean;
  responsibilityAckStatus?: 'pending' | 'agreed' | 'disagreed' | null;
  questions?: { issueId: string; questionKey: string; question: string; answer: string | null }[];
  completionEvidenceUrls?: string[];
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
  propertyId: string | null;
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
  propertyId: string | null;
  noticeTerms: {
    rentIncreaseOn: string | null;
    newRentWeekly: number;
    leaseAgreementPdfAvailable?: boolean;
    leaseAgreementSigned?: boolean;
    requiresLeaseAgreementSign?: boolean;
  } | null;
};

export type VacatingDto = {
  id: string;
  propertyId: string | null;
  propertyAddress: string | null;
  status: string;
  tenantResponsibilityReviewStatus?: 'none' | 'pending' | 'accepted' | 'declined';
  tenantResponsibilityItems?: { area: string; description: string; quote?: string | null; bondDeductible?: boolean }[];
  tenantRepairQuoteStatus?: 'pending' | 'accepted' | 'declined' | 'none';
  tenantBondAckSentAt?: string | null;
  vacatingDate: string | null;
  terminationReason: string | null;
  keysReturned: boolean;
  keyReturnPhotoUrls: string[];
  tenantKeyReturnSubmittedAt: string | null;
  cleaningArrangement: string;
  refundAmount: number | null;
  debtAmount: number | null;
  keysReturnAddress: string | null;
  repairQuoteSettlementSummary: {
    unpaidRent: number;
    unpaidBills: number;
    maintenanceCost: number;
    bondHeld: number;
    netRefund: number;
    debtAmount?: number;
  } | null;
  tenantSettlementStatus: 'pending' | 'accepted' | 'declined';
  movingReferralRequestedAt: string | null;
};

export type OnboardingStepDto = { id: string; status: string; amount?: number | null };

export type KeyCollectionDto = {
  status: string;
  time: string | null;
  timeEnd: string | null;
  location: string | null;
  photos?: string[];
};

export type OnboardingDto = { steps: OnboardingStepDto[]; keyCollection?: KeyCollectionDto | null };

export type RoutineInspectionDto = {
  id: string;
  flow: 'self' | 'in_person';
  status: string;
  scheduledAt: string | null;
  tenantActionRequired: boolean;
  propertyId: string;
  propertyAddress: string | null;
};

export type RoutineSelfArea = {
  areaName: string;
  skipped?: boolean;
  notes?: string;
  photoUrls: string[];
};

export type RoutineInspectionDetail = RoutineInspectionDto & {
  scheduleId?: string;
  bedrooms?: number | null;
  sections?: { id: string; room: string; photos: string[] }[];
  selfDraft?: { areas: RoutineSelfArea[]; areaIndex?: number; areaOrder?: string[] } | null;
};

export type OutgoingSection = {
  id: string;
  room: string;
  description: string;
  photos: string[];
  referencePhotos: string[];
  disputed: boolean;
  disputeComment: string | null;
};

export type OutgoingInspection = {
  id: string;
  vacatingCaseId: string;
  propertyAddress: string | null;
  scheduledAt: string | null;
  status: 'scheduled' | 'awaiting_report' | 'awaiting_confirmation' | 'confirmed';
  tenantApproved: boolean;
  tenantOutgoingAttendance: 'pending' | 'yes' | 'no';
  sectionCount: number;
  sections?: OutgoingSection[];
};

export function messageAttachment(file: EvidenceFile): components['schemas']['TenantMessageAttachmentUploadDto'] {
  return fileBody(file);
}

function fileBody(file: EvidenceFile) {
  return {
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes ?? Math.ceil((file.contentBase64.length * 3) / 4),
    contentBase64: file.contentBase64,
  };
}

function pages<T>(load: (page: number, pageSize: number) => Promise<Page<T>>): Promise<T[]> {
  return collectPages(load);
}

export const tenantApi = {
  tenancies: () =>
    pages(async (page, pageSize) => unwrap(await crossub.GET('/tenant/tenancies', { params: { query: { page, pageSize } } }))),
  ledger: () =>
    pages(async (page, pageSize) => unwrap(await crossub.GET('/tenant/ledger', { params: { query: { page, pageSize } } }))),
  properties: () =>
    pages(async (page, pageSize) => unwrap(await crossub.GET('/tenant/properties', { params: { query: { page, pageSize } } }))),
  documents: () => unwrap(crossub.GET('/tenant/documents')),
  applications: () =>
    pages(async (page, pageSize) => unwrap(await crossub.GET('/tenant/applications', { params: { query: { page, pageSize } } }))),

  getApplication: (applicationId: string) =>
    unwrap(crossub.GET('/tenant/applications/{applicationId}', { params: { path: { applicationId } } })),

  addApplicationDocument: (applicationId: string, body: components['schemas']['PublicApplicationDocumentDto']) =>
    unwrap(
      crossub.POST('/tenant/applications/{applicationId}/documents', {
        params: { path: { applicationId } },
        body,
      }),
    ),

  household: () => unwrap(crossub.GET('/tenant/household')),

  profile: () => unwrap(crossub.GET('/me')),

  updatePhone: (phone: string) => unwrap(crossub.PATCH('/me', { body: { phone } })),

  sessions: () => unwrap(crossub.GET('/me/sessions')),

  revokeSession: (sessionId: string) =>
    unwrap(crossub.DELETE('/me/sessions/{sessionId}', { params: { path: { sessionId } } })),
  maintenance: () =>
    pages(async (page, pageSize) =>
      unwrap(await crossub.GET('/tenant/maintenance-requests', { params: { query: { page, pageSize } } })),
    ),
  messages: () => unwrap(crossub.GET('/tenant/messages')),
  notifications: () => unwrap(crossub.GET('/tenant/notifications')),
  inspections: () =>
    pages(async (page, pageSize) => unwrap(await crossub.GET('/tenant/inspections', { params: { query: { page, pageSize } } }))),

  routineInspections: () => unwrap(crossub.GET('/tenant/routine-inspections')),

  getRoutineInspection: (id: string) =>
    unwrap(crossub.GET('/tenant/routine-inspections/{id}', { params: { path: { id } } })),

  startRoutineSelf: (id: string) =>
    unwrap(crossub.POST('/tenant/routine-inspections/{id}/start-self', { params: { path: { id } } })),

  saveRoutineSelfDraft: (id: string, body: { areaIndex?: number; areaOrder?: string[]; areas: RoutineSelfArea[] }) =>
    unwrap(crossub.PATCH('/tenant/routine-inspections/{id}/self-draft', { params: { path: { id } }, body })),

  submitRoutineSelf: (id: string, sections: { areaName: string; photoUrls: string[]; comment?: string }[]) =>
    unwrap(crossub.POST('/tenant/routine-inspections/{id}/submit-self', { params: { path: { id } }, body: { sections } })),

  outgoingInspections: () => unwrap(crossub.GET('/tenant/outgoing-inspections')),

  getOutgoingInspection: (id: string) =>
    unwrap(crossub.GET('/tenant/outgoing-inspections/{inspectionId}', { params: { path: { inspectionId: id } } })),

  disputeOutgoing: (id: string, body: { area: string; description: string; sectionId?: string }) =>
    unwrap(
      crossub.POST('/tenant/outgoing-inspections/{inspectionId}/disputes', {
        params: { path: { inspectionId: id } },
        body,
      }),
    ),

  approveOutgoing: (id: string) =>
    unwrap(crossub.PATCH('/tenant/outgoing-inspections/{inspectionId}/approve', { params: { path: { inspectionId: id } } })),

  ingoingInspections: () => unwrap(crossub.GET('/tenant/ingoing-inspections')),

  getIngoingInspection: (inspectionId: string) =>
    unwrap(crossub.GET('/tenant/ingoing-inspections/{inspectionId}', { params: { path: { inspectionId } } })),

  submitIngoingFeedback: (
    inspectionId: string,
    sectionId: string,
    body: { status: 'confirmed' | 'disputed'; comment?: string },
  ) =>
    unwrap(
      crossub.POST('/tenant/ingoing-inspections/{inspectionId}/sections/{sectionId}/feedback', {
        params: { path: { inspectionId, sectionId } },
        body,
      }),
    ),

  approveIngoing: (inspectionId: string) =>
    unwrap(crossub.PATCH('/tenant/ingoing-inspections/{inspectionId}/approve', { params: { path: { inspectionId } } })),

  rejectIngoing: (inspectionId: string, reason: string) =>
    unwrap(
      crossub.POST('/tenant/ingoing-inspections/{inspectionId}/reject', {
        params: { path: { inspectionId } },
        body: { reason },
      }),
    ),

  acceptSettlement: (caseId: string) =>
    unwrap(crossub.PATCH('/tenant/vacating-cases/{caseId}/settlement/accept', { params: { path: { caseId } } })),

  declineSettlement: (caseId: string, reason: string) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/settlement/decline', {
        params: { path: { caseId } },
        body: { reason },
      }),
    ),

  acceptRepairQuote: (caseId: string) =>
    unwrap(crossub.PATCH('/tenant/vacating-cases/{caseId}/repair-quote/accept', { params: { path: { caseId } } })),

  declineRepairQuote: (caseId: string, reason: string) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/repair-quote/decline', {
        params: { path: { caseId } },
        body: { reason },
      }),
    ),

  acceptResponsibilities: (caseId: string) =>
    unwrap(crossub.PATCH('/tenant/vacating-cases/{caseId}/responsibilities/accept', { params: { path: { caseId } } })),

  declineResponsibilities: (caseId: string, reason: string) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/responsibilities/decline', {
        params: { path: { caseId } },
        body: { reason },
      }),
    ),

  setOutgoingAttendance: (caseId: string, attendance: 'yes' | 'no') =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/outgoing-attendance', {
        params: { path: { caseId } },
        body: { attendance },
      }),
    ),
  rentReviews: () => unwrap(crossub.GET('/tenant/rent-reviews')),
  vacatingCases: () => unwrap(crossub.GET('/tenant/vacating-cases')),
  onboarding: () => unwrap(crossub.GET('/tenant/leasing/onboarding')),
  welcome: () => unwrap(crossub.GET('/tenant/onboarding/welcome')),

  uploadMaintenancePhoto: (file: EvidenceFile) =>
    unwrap(crossub.POST('/tenant/maintenance-requests/photos/upload', { body: fileBody(file) })),

  createMaintenance: (body: { description: string; urgent: boolean; photos: string[]; propertyId?: string }) =>
    unwrap(crossub.POST('/tenant/maintenance-requests', { body })),

  respondSchedule: (requestId: string, decision: 'approved' | 'declined', declineReason?: string) =>
    unwrap(
      crossub.PATCH('/tenant/maintenance-requests/{requestId}/schedule-response', {
        params: { path: { requestId } },
        body: { decision, ...(declineReason ? { declineReason } : {}) },
      }),
    ),

  createMessage: (body: components['schemas']['CreateTenantMessageThreadDto']) =>
    unwrap(crossub.POST('/tenant/messages', { body })),

  replyMessage: (threadId: string, body: components['schemas']['SendTenantMessageDto']) =>
    unwrap(crossub.POST('/tenant/messages/{threadId}/reply', { params: { path: { threadId } }, body })),

  markMessageRead: (threadId: string) =>
    unwrap(crossub.PATCH('/tenant/messages/{threadId}/read', { params: { path: { threadId } } })),

  markNotificationRead: (id: string) =>
    unwrap(crossub.PATCH('/tenant/notifications/{notificationId}/read', { params: { path: { notificationId: id } } })),

  signLeaseAgreement: (reviewId: string) =>
    unwrap(crossub.POST('/tenant/rent-reviews/{reviewId}/sign-lease-agreement', { params: { path: { reviewId } } })),

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
    unwrap(crossub.PATCH('/tenant/rent-reviews/{reviewId}/respond', { params: { path: { reviewId } }, body })),

  createVacating: (body: { expectedVacateDate: string; propertyId?: string; terminationReason?: string }) =>
    unwrap(crossub.POST('/tenant/vacating-cases', { body })),

  uploadKeyReturnPhoto: (caseId: string, file: EvidenceFile) =>
    unwrap(
      crossub.POST('/tenant/vacating-cases/{caseId}/key-return/photos/upload', {
        params: { path: { caseId } },
        body: fileBody(file),
      }),
    ),

  submitKeyReturn: (caseId: string, photoUrls: string[]) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/key-return', {
        params: { path: { caseId } },
        body: { photoUrls },
      }),
    ),

  requestMovingReferral: (caseId: string) =>
    unwrap(crossub.POST('/tenant/vacating-cases/{caseId}/moving-referral', { params: { path: { caseId } } })),

  newLeasing: () => unwrap(crossub.GET('/tenant/new-leasing')),

  updateVacateDate: (caseId: string, date: string) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/vacate-date', {
        params: { path: { caseId } },
        body: { date },
      }),
    ),

  cancelVacating: (caseId: string, reason?: string) =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/cancel', {
        params: { path: { caseId } },
        body: reason ? { reason } : {},
      }),
    ),

  approveRepairCompletion: (requestId: string) =>
    unwrap(
      crossub.PATCH('/tenant/maintenance-requests/{requestId}/completion-approval', {
        params: { path: { requestId } },
        body: { approved: true },
      }),
    ),

  ackRepairResponsibility: (requestId: string, body: components['schemas']['TenantMaintenanceResponsibilityAckDto']) =>
    unwrap(
      crossub.PATCH('/tenant/maintenance-requests/{requestId}/responsibility-ack', {
        params: { path: { requestId } },
        body,
      }),
    ),

  answerRepairQuestions: (requestId: string, body: components['schemas']['RecordMaintenanceIssueAnswersDto']) =>
    unwrap(
      crossub.PATCH('/tenant/maintenance-requests/{requestId}/answers', {
        params: { path: { requestId } },
        body,
      }),
    ),

  markAllNotificationsRead: () => unwrap(crossub.POST('/tenant/notifications/read-all')),

  createVoiceSession: () => unwrap(crossub.POST('/tenant/voice/session')),

  setCleaning: (caseId: string, choice: 'own_arrangement' | 'booked') =>
    unwrap(
      crossub.PATCH('/tenant/vacating-cases/{caseId}/cleaning', {
        params: { path: { caseId } },
        body: { choice },
      }),
    ),

  uploadProof: (kind: 'deposit' | 'bond', file: EvidenceFile) =>
    kind === 'deposit'
      ? unwrap(crossub.POST('/tenant/leasing/onboarding/deposit/proof/upload', { body: fileBody(file) }))
      : unwrap(crossub.POST('/tenant/leasing/onboarding/bond/proof/upload', { body: fileBody(file) })),

  submitProof: (kind: 'deposit' | 'bond', proofUrl: string, fileName: string) =>
    kind === 'deposit'
      ? unwrap(crossub.PATCH('/tenant/leasing/onboarding/deposit/proof', { body: { proofUrl, fileName } }))
      : unwrap(crossub.PATCH('/tenant/leasing/onboarding/bond/proof', { body: { proofUrl, fileName } })),

  recordLeaseSigning: () => unwrap(crossub.POST('/tenant/leasing/onboarding/agreement/record-signing')),

  uploadKeyCollectionPhoto: (file: EvidenceFile) =>
    unwrap(crossub.POST('/tenant/leasing/onboarding/key-collection/photos/upload', { body: fileBody(file) })),

  submitKeyCollection: (body: { time: string; location: string; photoUrls: string[]; timeEnd?: string }) =>
    unwrap(crossub.PATCH('/tenant/leasing/onboarding/key-collection', { body })),

  acknowledgeWelcome: () => unwrap(crossub.POST('/tenant/onboarding/welcome/acknowledge')),
};

export function departmentFor(category: string): Department {
  if (category === 'Maintenance') return 'MAINTENANCE';
  if (category === 'Inspection') return 'INSPECTION';
  if (category === 'Leasing') return 'LEASING';
  return 'GENERAL';
}
