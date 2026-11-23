import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/src/auth/auth-context';
import { ApiError } from '@/src/api/http';
import { loadAccount, scopeAccount, type LiveDocument, type LiveInspection, type LiveKeyCollection, type LiveLedgerRow, type LiveMaintenance, type LiveReview, type LiveRoutineAction, type LiveTenancy, type LiveVacating } from '@/src/api/load-account';
import type { GuestApplicationInput } from '@/src/api/listings';
import { departmentFor, messageAttachment, tenantApi, type EvidenceFile } from '@/src/api/tenant';
import {
  FINDINGS,
  PROPERTIES,
  ROOMS,
  scenarioById,
  type ActivityFilter,
  type CleaningChoice,
  type FindingResponse,
  type InboxFilter,
  type KeyMode,
  type Property,
  type PropertyId,
  type ScenarioId,
  type Thread,
} from '@/src/demo/model';
import {
  emptyOnboarding,
  type ApplicationRecord,
  type OnboardingStatus,
  type OnboardingStepId,
} from '@/src/demo/applications';
import { type RentReviewStatus } from '@/src/demo/tenancy-notices';

type FindingState = { response: FindingResponse; reason: string };

export type CheckIn = {
  propertyId: string;
  sessionId: string;
  name: string;
  email: string;
  phone: string;
  leaseTerm: string;
  pets: string;
  specialRequest: string;
  comments: string;
};

type DemoState = {
  scenarioId: ScenarioId;
  accountingKnown: boolean;
  propertyId: PropertyId;
  activityFilter: ActivityFilter;
  inboxFilter: InboxFilter;
  inspectionConfirmed: boolean;
  renewalResponded: boolean;
  cleaning: CleaningChoice | null;
  keyMode: KeyMode;
  keyBooked: boolean;
  keyPhoto: boolean;
  keyRecorded: boolean;
  accountStatus: 'idle' | 'loading' | 'ready' | 'error';
  accountError: string | null;
  ledgerConnected: boolean;
  propertyUuid: string | null;
  liveProperty: Property | null;
  rentPaidTo: string;
  rentPaidToIso: string | null;
  paymentCycle: string | null;
  paymentReference: string;
  rentPaymentNote: { amount: number; at: string } | null;
  ledger: LiveLedgerRow[];
  documents: LiveDocument[];
  tenancies: LiveTenancy[];
  selectedTenancyId: string | null;
  inspections: LiveInspection[];
  rentReviews: LiveReview[];
  rentReview: LiveReview | null;
  vacatingCases: LiveVacating[];
  vacating: LiveVacating | null;
  maintenance: LiveMaintenance[];
  maintenanceAll: LiveMaintenance[];
  tenantName: string;
  keyReturnPhotos: string[];
  keyReturnFiles: Record<string, EvidenceFile>;
  keyReturnSubmitted: boolean;
  notices: { id: string; title: string; body: string; href: string; read: boolean; type: string }[];
  attachments: Record<string, string>;
  photoCounts: Record<string, number>;
  selfVersion: number;
  selfSubmitted: boolean;
  findings: Record<number, FindingState>;
  entryAcknowledged: boolean;
  settlementMethod: string | null;
  replies: Record<string, string>;
  cros: string[];
  threads: Thread[];
  activeThreadId: string;
  toast: string | null;
  checkIns: Record<string, CheckIn>;
  applications: ApplicationRecord[];
  onboarding: Record<OnboardingStepId, OnboardingStatus>;
  onboardingAmounts: Partial<Record<OnboardingStepId, number>>;
  keyCollection: LiveKeyCollection | null;
  routineAction: LiveRoutineAction | null;
  onboardingProofs: Record<string, string>;
  tutorialDone: boolean;
  guideSeen: boolean;
  agreementName: string | null;
  rentReviewStatus: RentReviewStatus;
  rentReviewCounter: number | null;
  rentReviewMoveOut: string;
  terminationMoveOut: string;
  terminationStarted: boolean;
  movingRequested: boolean;
  nextRoutineAt: string | null;
  nextRentReviewAt: string | null;
  onboardingActive: boolean;
  onboardingComplete: boolean;
  onboardingStepIds: OnboardingStepId[];
};

const initialCounts = Object.fromEntries(ROOMS.map((room) => [room, 0]));
const submitLocks = new Set<string>();
let maintenanceSubmit: Promise<string | null> | null = null;

function guardSubmit(key: string, run: () => Promise<void>): void {
  if (submitLocks.has(key)) return;
  submitLocks.add(key);
  void run().finally(() => submitLocks.delete(key));
}

function existingRequestId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as { id?: unknown; message?: unknown };
  if (typeof record.id === 'string') return record.id;
  if (record.message && typeof record.message === 'object') {
    const nested = (record.message as { id?: unknown }).id;
    if (typeof nested === 'string') return nested;
  }
  return null;
}

const initialState: DemoState = {
  scenarioId: 'crossub',
  accountingKnown: false,
  propertyId: 'berry',
  activityFilter: 'All',
  inboxFilter: 'All',
  inspectionConfirmed: false,
  renewalResponded: false,
  cleaning: null,
  keyMode: 'Crossub Booking',
  keyBooked: false,
  keyPhoto: false,
  keyRecorded: false,
  accountStatus: 'idle',
  accountError: null,
  ledgerConnected: false,
  propertyUuid: null,
  liveProperty: null,
  rentPaidTo: '',
  rentPaidToIso: null,
  paymentCycle: null,
  paymentReference: '',
  rentPaymentNote: null,
  ledger: [],
  documents: [],
  tenancies: [],
  selectedTenancyId: null,
  inspections: [],
  rentReviews: [],
  rentReview: null,
  vacatingCases: [],
  vacating: null,
  maintenance: [],
  maintenanceAll: [],
  tenantName: '',
  keyReturnPhotos: [],
  keyReturnFiles: {},
  keyReturnSubmitted: false,
  notices: [],
  attachments: {},
  photoCounts: initialCounts,
  selfVersion: 1,
  selfSubmitted: false,
  findings: {},
  entryAcknowledged: false,
  settlementMethod: null,
  replies: {},
  cros: [],
  threads: [],
  activeThreadId: '',
  toast: null,
  checkIns: {},
  applications: [],
  onboarding: emptyOnboarding(),
  onboardingAmounts: {},
  keyCollection: null,
  routineAction: null,
  onboardingProofs: {},
  tutorialDone: false,
  guideSeen: false,
  agreementName: null,
  rentReviewStatus: 'pending',
  rentReviewCounter: null,
  rentReviewMoveOut: '',
  terminationMoveOut: '',
  terminationStarted: false,
  movingRequested: false,
  nextRoutineAt: null,
  nextRentReviewAt: null,
  onboardingActive: false,
  onboardingComplete: false,
  onboardingStepIds: [],
};

type DemoApi = DemoState & {
  scenario: ReturnType<typeof scenarioById>;
  property: (typeof PROPERTIES)[PropertyId];
  current: boolean;
  setProperty: (id: PropertyId) => void;
  setActivityFilter: (filter: ActivityFilter) => void;
  setInboxFilter: (filter: InboxFilter) => void;
  confirmInspection: () => void;
  respondRenewal: () => void;
  setCleaning: (choice: CleaningChoice) => void;
  setKeyMode: (mode: KeyMode) => void;
  bookKey: () => void;
  attachKeyPhoto: () => void;
  submitKeyEvidence: () => boolean;
  refreshAccount: () => Promise<void>;
  selectTenancy: (id: string) => void;
  noteRentPayment: (amount: number) => void;
  addMaintenance: (title: string, urgent: boolean, photos: EvidenceFile[], video: string, propertyId: string, clientRequestId: string) => Promise<string | null>;
  addKeyReturnPhoto: (file: EvidenceFile) => string | null;
  removeKeyReturnPhoto: (name: string) => void;
  submitKeyReturn: () => boolean;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  markThreadRead: (id: string) => void;
  attachToThread: (id: string, name: string) => void;
  addRoomPhoto: (room: string) => void;
  submitSelf: () => boolean;
  startRevision: () => void;
  setFinding: (id: number, response: FindingResponse, reason?: string) => void;
  findingsReady: () => boolean;
  acknowledgeEntry: () => void;
  requestSettlement: (method: string) => void;
  sendCros: (text: string) => 'ok' | 'escalate' | 'empty';
  sendChat: (threadId: string, text: string, file?: EvidenceFile | null) => Promise<boolean>;
  createThread: (input: { category: Thread['category']; subject: string; body: string; file?: EvidenceFile | null }) => Promise<string>;
  submitCheckIn: (input: CheckIn) => Promise<string | null>;
  submitApplication: (
    input: Omit<ApplicationRecord, 'id' | 'reference' | 'submittedAt' | 'status' | 'documents' | 'missingDocuments' | 'isRenewal'> & {
      annualIncome: number;
      moveInDate: string;
      documents: NonNullable<GuestApplicationInput['documents']>;
    },
  ) => Promise<string>;
  uploadOnboardingProof: (stepId: OnboardingStepId, file: EvidenceFile) => string | null;
  confirmOnboarding: (stepId: OnboardingStepId) => void;
  submitKeyCollection: (time: string, location: string, file: EvidenceFile) => void;
  finishTutorial: () => void;
  finishGuide: () => void;
  acceptAgreement: (name: string) => string | null;
  acceptRentReview: () => void;
  counterRentReview: (amount: number) => string | null;
  vacateFromRentReview: (date: string) => string | null;
  confirmTermination: (date: string) => string | null;
  requestMoving: () => void;
  notify: (message: string) => void;
};

const DemoContext = createContext<DemoApi | null>(null);

function failureMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [state, setState] = useState<DemoState>(initialState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshLock = useRef(false);

  const notify = useCallback((message: string) => {
    setState((current) => ({ ...current, toast: message }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState((current) => ({ ...current, toast: null }));
    }, 2800);
  }, []);

  const patch = useCallback((partial: Partial<DemoState>) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  const refreshAccount = useCallback(async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setState((current) => ({ ...current, accountStatus: current.accountStatus === 'ready' ? 'ready' : 'loading', accountError: null }));
    try {
      const loaded = await loadAccount();
      setState((current) => ({ ...current, ...loaded }));
    } catch (err) {
      setState((current) => ({
        ...current,
        accountStatus: 'error',
        accountError: failureMessage(err, 'Could not load your tenancy.'),
      }));
    } finally {
      refreshLock.current = false;
    }
  }, []);

  useEffect(() => {
    if (status !== 'authed') {
      setState((current) => ({ ...current, accountStatus: 'idle' }));
      return;
    }
    void refreshAccount();
  }, [refreshAccount, status]);

  const api = useMemo<DemoApi>(() => {
    const scoped = scopeAccount(state);
    const scenario = scenarioById(scoped.scenarioId);
    const property =
      scoped.liveProperty ??
      (state.accountStatus === 'ready'
        ? {
            id: state.propertyId,
            title: 'No current tenancy',
            place: '',
            status: 'Previous' as const,
            type: '',
            start: '',
            end: '',
            rent: 0,
            frequency: 'Weekly',
            extras: '',
          }
        : PROPERTIES[state.propertyId]);
    const current = property.status === 'Current';

    return {
      ...state,
      ...scoped,
      scenario,
      property,
      current,
      refreshAccount,
      selectTenancy: (id) => {
        const tenancy = state.tenancies.find((item) => item.id === id);
        if (!tenancy) return;
        const next = scopeAccount({ ...state, selectedTenancyId: id });
        const cleaning = next.vacating?.cleaning === 'booked' ? 'Crossub Cleaning' : next.vacating?.cleaning === 'own_arrangement' ? 'Tenant Arranged' : null;
        patch({ selectedTenancyId: id, cleaning });
      },
      noteRentPayment: (amount) => {
        patch({ rentPaymentNote: { amount, at: new Date().toISOString() } });
        notify('Payment noted. The ledger updates when the transfer clears.');
      },
      setProperty: (propertyId) => patch({ propertyId }),
      setActivityFilter: (activityFilter) => patch({ activityFilter }),
      setInboxFilter: (inboxFilter) => patch({ inboxFilter }),
      confirmInspection: () => {
        patch({ inspectionConfirmed: true });
        guardSubmit(`attendance:${scoped.propertyUuid ?? 'home'}`, async () => {
          try {
            await tenantApi.createMessage({
              subject: 'Routine inspection',
              body: 'I can attend the scheduled inspection.',
              department: 'INSPECTION',
              ...(scoped.propertyUuid ? { propertyId: scoped.propertyUuid } : {}),
            });
            notify('Attendance sent to your property manager');
          } catch (err) {
            notify(failureMessage(err, 'Could not confirm attendance'));
          }
        });
      },
      respondRenewal: () => {
        patch({ renewalResponded: true });
        notify('Response recorded. This is not a signed lease.');
      },
      setCleaning: (cleaning) => {
        patch({ cleaning });
        const caseId = scoped.vacating?.id;
        if (!caseId) return;
        const choice = cleaning === 'Crossub Cleaning' ? 'booked' : 'own_arrangement';
        guardSubmit(`cleaning:${caseId}`, async () => {
          try {
            await tenantApi.setCleaning(caseId, choice);
          } catch (err) {
            notify(failureMessage(err, 'Could not save the cleaning choice'));
          }
        });
      },
      setKeyMode: (keyMode) => patch({ keyMode }),
      bookKey: () => {
        patch({ keyBooked: true });
        notify('Key appointment requested');
      },
      attachKeyPhoto: () => {
        patch({ keyPhoto: true });
        notify('Photo attached');
      },
      submitKeyEvidence: () => {
        if (!state.keyPhoto) {
          notify('Add at least one photo first');
          return false;
        }
        patch({ keyRecorded: true });
        notify('Evidence sent for confirmation');
        return true;
      },
      addMaintenance: (title, urgent, photos, video, propertyId, clientRequestId) => {
        if (maintenanceSubmit) return maintenanceSubmit;
        const trimmed = title.trim();
        const files = video.trim() && photos.length === 0 ? [] : photos;
        if (!trimmed) {
          notify('Describe the issue first');
          return Promise.resolve(null);
        }
        if (files.length === 0) {
          notify('Add at least one photo or video');
          return Promise.resolve(null);
        }
        if (!propertyId || !clientRequestId) {
          notify('Choose the property for this repair');
          return Promise.resolve(null);
        }
        const selected = state.tenancies.find((item) => item.propertyId === propertyId && item.current);
        if (!selected) {
          notify('This tenancy has ended. New requests are closed.');
          return Promise.resolve(null);
        }
        maintenanceSubmit = (async () => {
          try {
            const urls: string[] = [];
            for (const file of files) urls.push((await tenantApi.uploadMaintenancePhoto(file)).url);
            const created = await tenantApi.createMaintenance({
              description: trimmed,
              urgent,
              photos: urls,
              propertyId,
              clientRequestId,
            });
            if (created.propertyId && created.propertyId !== propertyId) {
              notify('This report was filed on a different property from the one you selected.');
            }
            const filed = state.tenancies.find((item) => item.propertyId === (created.propertyId || propertyId));
            if (filed) patch({ selectedTenancyId: filed.id });
            await refreshAccount();
            notify(`${created.orderNumber || created.id.slice(0, 8)} issued.`);
            return created.id;
          } catch (err) {
            const existing = err instanceof ApiError && err.status === 409 ? existingRequestId(err.body) : null;
            if (existing) return existing;
            notify(failureMessage(err, 'Could not submit the repair'));
            return null;
          } finally {
            maintenanceSubmit = null;
          }
        })();
        return maintenanceSubmit;
      },
      addKeyReturnPhoto: (file) => {
        if (state.keyReturnPhotos.length >= 4) return 'Maximum 4 photos.';
        const name = state.keyReturnPhotos.includes(file.fileName) ? `${Date.now()}-${file.fileName}` : file.fileName;
        patch({
          keyReturnPhotos: [...state.keyReturnPhotos, name],
          keyReturnFiles: { ...state.keyReturnFiles, [name]: { ...file, fileName: name } },
        });
        return null;
      },
      removeKeyReturnPhoto: (name) => {
        const next = { ...state.keyReturnFiles };
        delete next[name];
        patch({ keyReturnPhotos: state.keyReturnPhotos.filter((item) => item !== name), keyReturnFiles: next });
      },
      submitKeyReturn: () => {
        if (state.keyReturnPhotos.length === 0) {
          notify('Add at least one photo of the keys or access devices');
          return false;
        }
        const caseId = scoped.vacating?.id;
        if (!caseId) {
          notify('No vacating case is open on this account.');
          return false;
        }
        guardSubmit(`key-return:${caseId}`, async () => {
          try {
            const urls: string[] = [];
            for (const name of state.keyReturnPhotos) {
              const file = state.keyReturnFiles[name];
              if (file) urls.push((await tenantApi.uploadKeyReturnPhoto(caseId, file)).url);
              else if (name.startsWith('http')) urls.push(name);
            }
            if (urls.length === 0) {
              notify('Choose a photo from your library.');
              return;
            }
            await tenantApi.submitKeyReturn(caseId, urls);
            patch({ keyReturnSubmitted: true, keyReturnPhotos: urls });
            notify('Key return submitted for confirmation');
          } catch (err) {
            notify(failureMessage(err, 'Could not submit the key return'));
          }
        });
        return true;
      },
      markNoticeRead: (id) => {
        guardSubmit(`notice:${id}`, async () => {
          try {
            await tenantApi.markNotificationRead(id);
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not mark that notification read'));
          }
        });
      },
      markAllNoticesRead: () => {
        guardSubmit('notices', async () => {
          try {
            await tenantApi.markAllNotificationsRead();
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not mark notifications read'));
          }
        });
      },
      markThreadRead: (id) => {
        patch({ threads: state.threads.map((item) => (item.id === id ? { ...item, unread: false } : item)) });
        guardSubmit(`thread-read:${id}`, async () => {
          try {
            await tenantApi.markMessageRead(id);
          } catch {
            // Reading a thread should not block the conversation.
          }
        });
      },
      attachToThread: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        patch({
          attachments: { ...state.attachments, [id]: trimmed },
          threads: state.threads.map((item) => (item.id === id ? { ...item, attachment: trimmed } : item)),
        });
      },
      addRoomPhoto: (room) => {
        if (state.selfSubmitted) return;
        patch({
          photoCounts: {
            ...state.photoCounts,
            [room]: (state.photoCounts[room] ?? 0) + 1,
          },
        });
        notify('Draft saved on this device');
      },
      submitSelf: () => {
        const missing = ROOMS.some((room) => (state.photoCounts[room] ?? 0) < 3);
        if (missing) {
          notify('At least 3 photos are required in every room');
          return false;
        }
        patch({ selfSubmitted: true });
        notify(`Version ${state.selfVersion} submitted and locked`);
        return true;
      },
      startRevision: () => {
        patch({
          selfVersion: state.selfVersion + 1,
          selfSubmitted: false,
          photoCounts: { ...initialCounts },
        });
        notify(`Version ${state.selfVersion} stays locked. Version ${state.selfVersion + 1} is a new draft.`);
      },
      setFinding: (id, response, reason) => {
        patch({
          findings: {
            ...state.findings,
            [id]: { response, reason: reason ?? state.findings[id]?.reason ?? '' },
          },
        });
      },
      findingsReady: () => FINDINGS.every((finding) => state.findings[finding.id]),
      acknowledgeEntry: () => {
        patch({ entryAcknowledged: true });
        notify('Acknowledgement recorded for your account only');
      },
      requestSettlement: (method) => {
        patch({ settlementMethod: method });
        notify('Request sent for manager approval. Nothing is paid or deducted here.');
      },
      sendCros: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return 'empty';
        patch({ cros: [...state.cros, trimmed] });
        if (/permission|approval|landlord|manager/i.test(trimmed)) return 'escalate';
        return 'ok';
      },
      sendChat: async (threadId, text, file) => {
        const trimmed = text.trim();
        if (!trimmed && !file) return false;
        const thread = state.threads.find((item) => item.id === threadId);
        if (thread?.status === 'Completed') {
          notify('This conversation is closed. Start a new enquiry.');
          return false;
        }
        const key = `chat:${threadId}`;
        if (submitLocks.has(key)) return false;
        submitLocks.add(key);
        try {
          await tenantApi.replyMessage(threadId, {
            body: trimmed,
            ...(file ? { attachments: [messageAttachment(file)] } : {}),
          });
          await refreshAccount();
          return true;
        } catch (err) {
          notify(failureMessage(err, 'Could not send the message'));
          return false;
        } finally {
          submitLocks.delete(key);
        }
      },
      createThread: async ({ category, subject, body, file }) => {
        if (!subject.trim() || (!body.trim() && !file)) {
          notify('Add a subject and a message');
          return '';
        }
        const key = 'new-message';
        if (submitLocks.has(key)) return '';
        submitLocks.add(key);
        try {
          const created = await tenantApi.createMessage({
            subject: subject.trim(),
            body: body.trim(),
            department: departmentFor(category),
            ...(scoped.propertyUuid ? { propertyId: scoped.propertyUuid } : {}),
            ...(file ? { attachments: [messageAttachment(file)] } : {}),
          });
          await refreshAccount();
          notify(`Sent to ${scenario.team}`);
          return created.id;
        } catch (err) {
          notify(failureMessage(err, 'Could not send the message'));
          return '';
        } finally {
          submitLocks.delete(key);
        }
      },
      submitCheckIn: async (input) => {
        if (!input.name.trim() || !input.email.includes('@') || !input.phone.trim()) {
          return 'Enter your name, email, and phone number.';
        }
        if (!input.sessionId) return 'This check-in link is missing the inspection session.';
        const lockKey = `check-in:${input.sessionId}`;
        if (submitLocks.has(lockKey)) return 'Check-in is already being sent.';
        submitLocks.add(lockKey);
        try {
          await import('@/src/api/listings').then(({ submitOpenViewingCheckIn }) =>
            submitOpenViewingCheckIn(input.sessionId, {
              name: input.name.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              notes: input.specialRequest,
              leaseTerm: input.leaseTerm,
              pets: input.pets,
              comments: input.comments,
            }),
          );
          const key = `${input.propertyId}:${input.sessionId}`;
          patch({
            checkIns: {
              ...state.checkIns,
              [key]: { ...input, name: input.name.trim(), email: input.email.trim(), phone: input.phone.trim() },
            },
          });
          return null;
        } catch (err) {
          return failureMessage(err, 'Failed to submit check-in');
        } finally {
          submitLocks.delete(lockKey);
        }
      },
      submitApplication: async (input) => {
        const employment = input.employment.toLowerCase();
        const employmentStatus = employment.includes('self')
          ? 'self_employed'
          : employment.includes('retir')
            ? 'retired'
            : employment.includes('unemploy')
              ? 'unemployed'
              : 'employed';
        const { documents, annualIncome, moveInDate, ...formData } = input;
        const key = `application:${input.propertyId}:${input.email.trim().toLowerCase()}`;
        if (submitLocks.has(key)) return '';
        submitLocks.add(key);
        try {
          const { submitGuestApplication } = await import('@/src/api/listings');
          const created = await submitGuestApplication(input.propertyId, {
            fullName: input.applicantName,
            email: input.email,
            phone: input.phone,
            annualIncome,
            employmentStatus,
            moveInDate,
            documents,
            formData,
          });
          notify(`Application ${created.reference} submitted`);
          await refreshAccount();
          return created.id;
        } catch (err) {
          notify(failureMessage(err, 'Could not submit the application'));
          return '';
        } finally {
          submitLocks.delete(key);
        }
      },
      uploadOnboardingProof: (stepId, file) => {
        if (stepId !== 'deposit' && stepId !== 'bond') return 'This step does not take a receipt upload.';
        guardSubmit(`proof:${stepId}`, async () => {
          try {
            const uploaded = await tenantApi.uploadProof(stepId, file);
            await tenantApi.submitProof(stepId, uploaded.url, file.fileName);
            patch({
              onboarding: { ...state.onboarding, [stepId]: 'uploaded' },
              onboardingProofs: { ...state.onboardingProofs, [stepId]: file.fileName },
            });
            notify('Proof sent for confirmation');
          } catch (err) {
            notify(failureMessage(err, 'Could not upload the proof'));
          }
        });
        return null;
      },
      confirmOnboarding: (stepId) => {
        if (stepId === 'lease_signing') {
          guardSubmit('lease-signing', async () => {
            try {
              await tenantApi.recordLeaseSigning();
              patch({ onboarding: { ...state.onboarding, [stepId]: 'completed' } });
              notify('Lease acceptance sent');
            } catch (err) {
              notify(failureMessage(err, 'Could not record the lease signing'));
            }
          });
          return;
        }
        if (stepId === 'key_pickup') {
          notify('Add the collection time, location, and a photo');
          return;
        }
        notify('This step is updated when your property manager confirms it');
      },
      submitKeyCollection: (time, location, file) => {
        guardSubmit('key-collection', async () => {
          try {
            const uploaded = await tenantApi.uploadKeyCollectionPhoto(file);
            await tenantApi.submitKeyCollection({ time, location, photoUrls: [uploaded.url] });
            patch({
              onboarding: { ...state.onboarding, key_pickup: 'completed' },
              keyCollection: { time, location, status: 'completed' },
            });
            notify('Key collection sent');
          } catch (err) {
            notify(failureMessage(err, 'Could not save key collection'));
          }
        });
      },
      finishTutorial: () => {
        patch({ tutorialDone: true });
        notify('Tutorial complete');
      },
      finishGuide: () => {
        patch({ guideSeen: true });
        guardSubmit('welcome', async () => {
          try {
            await tenantApi.acknowledgeWelcome();
          } catch (err) {
            notify(failureMessage(err, 'Could not save the welcome guide'));
          }
        });
      },
      acceptAgreement: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return 'Enter your full legal name.';
        guardSubmit('agreement', async () => {
          try {
            await tenantApi.recordLeaseSigning();
            patch({ agreementName: trimmed });
            notify('Agreement acceptance sent');
          } catch (err) {
            notify(failureMessage(err, 'Could not record the agreement'));
          }
        });
        return null;
      },
      acceptRentReview: () => {
        const review = scoped.rentReview;
        if (!review) {
          notify('No rent review is open on this account.');
          return;
        }
        guardSubmit(`rent-review:${review.id}:accept`, async () => {
          try {
            await tenantApi.respondRentReview(review.id, {
              decision: 'accept',
              respondingToOfferId: review.offerId,
              expectedVersion: review.version,
            });
            patch({ rentReviewStatus: 'accepted', rentReviewCounter: null });
            notify('Rent increase accepted. This does not sign the lease.');
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not accept the rent review'));
          }
        });
      },
      counterRentReview: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return 'Enter a weekly amount.';
        const review = scoped.rentReview;
        if (!review) return 'No rent review is open on this account.';
        guardSubmit(`rent-review:${review.id}:counter`, async () => {
          try {
            await tenantApi.respondRentReview(review.id, {
              decision: 'counter',
              counterWeekly: amount,
              respondingToOfferId: review.offerId,
              expectedVersion: review.version,
            });
            patch({ rentReviewStatus: 'countered', rentReviewCounter: amount });
            notify('Counter-offer sent');
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not send the counter-offer'));
          }
        });
        return null;
      },
      vacateFromRentReview: (date) => {
        if (!date.trim()) return 'Enter the date you plan to vacate.';
        const review = scoped.rentReview;
        if (!review) return 'No rent review is open on this account.';
        guardSubmit(`rent-review:${review.id}:decline`, async () => {
          try {
            await tenantApi.respondRentReview(review.id, {
              decision: 'decline',
              moveOutDate: date.trim(),
              respondingToOfferId: review.offerId,
              expectedVersion: review.version,
            });
            patch({ rentReviewStatus: 'vacating', rentReviewMoveOut: date.trim() });
            notify('Notice to vacate sent');
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not send notice to vacate'));
          }
        });
        return null;
      },
      confirmTermination: (date) => {
        if (!date.trim()) return 'Select a move-out date.';
        guardSubmit(`vacating:${scoped.propertyUuid ?? 'home'}`, async () => {
          try {
            await tenantApi.createVacating({
              expectedVacateDate: date.trim(),
              ...(scoped.propertyUuid ? { propertyId: scoped.propertyUuid } : {}),
            });
            patch({ terminationMoveOut: date.trim(), terminationStarted: true });
            notify('Vacating case opened');
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not open the vacating case'));
          }
        });
        return null;
      },
      requestMoving: () => {
        const caseId = scoped.vacating?.id;
        if (!caseId) {
          notify('A vacating case is required before a moving referral.');
          return;
        }
        guardSubmit(`moving:${caseId}`, async () => {
          try {
            await tenantApi.requestMovingReferral(caseId);
            notify('Moving referral requested. This does not book a mover.');
            await refreshAccount();
          } catch (err) {
            notify(failureMessage(err, 'Could not request a moving referral'));
          }
        });
      },
      notify,
    };
  }, [notify, patch, refreshAccount, state]);

  return <DemoContext.Provider value={api}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
