import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/src/auth/auth-context';
import { ApiError } from '@/src/api/http';
import { loadAccount, type LiveDocument, type LiveInspection, type LiveLedgerRow, type LiveMaintenance, type LiveReview, type LiveVacating } from '@/src/api/load-account';
import { departmentFor, tenantApi, type EvidenceFile } from '@/src/api/tenant';
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
  paymentReference: string;
  ledger: LiveLedgerRow[];
  documents: LiveDocument[];
  inspections: LiveInspection[];
  rentReview: LiveReview | null;
  vacating: LiveVacating | null;
  maintenance: LiveMaintenance[];
  keyReturnPhotos: string[];
  keyReturnFiles: Record<string, EvidenceFile>;
  keyReturnSubmitted: boolean;
  notices: { id: string; title: string; body: string; href: string; read: boolean }[];
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
};

const initialCounts = Object.fromEntries(ROOMS.map((room) => [room, 0]));

const initialState: DemoState = {
  scenarioId: 'crossub',
  propertyId: 'berry',
  activityFilter: 'Action Required',
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
  paymentReference: '',
  ledger: [],
  documents: [],
  inspections: [],
  rentReview: null,
  vacating: null,
  maintenance: [],
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
};

type DemoApi = DemoState & {
  scenario: ReturnType<typeof scenarioById>;
  property: (typeof PROPERTIES)[PropertyId];
  current: boolean;
  setScenario: (id: ScenarioId) => void;
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
  addMaintenance: (title: string, urgent: boolean, photos: EvidenceFile[], video: string) => Promise<string | null>;
  addKeyReturnPhoto: (file: EvidenceFile) => string | null;
  removeKeyReturnPhoto: (name: string) => void;
  submitKeyReturn: () => boolean;
  markNoticeRead: (id: string) => void;
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
  sendChat: (threadId: string, text: string) => Promise<boolean>;
  createThread: (input: { category: Thread['category']; subject: string; body: string; attachment?: string }) => Promise<string>;
  submitCheckIn: (input: CheckIn) => Promise<string | null>;
  submitApplication: (input: Omit<ApplicationRecord, 'id' | 'reference' | 'submittedAt' | 'status' | 'documents' | 'missingDocuments'> & { documents: string[] }) => Promise<string>;
  uploadApplicationDocument: (id: string, name: string) => void;
  uploadOnboardingProof: (stepId: OnboardingStepId, file: EvidenceFile) => string | null;
  confirmOnboarding: (stepId: OnboardingStepId) => void;
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
    const baseScenario = scenarioById(state.scenarioId);
    const scenario = state.accountStatus === 'ready' ? { ...baseScenario, ledger: state.ledgerConnected } : baseScenario;
    const property =
      state.liveProperty ??
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
      scenario,
      property,
      current,
      refreshAccount,
      setScenario: (scenarioId) => patch({ scenarioId }),
      setProperty: (propertyId) => patch({ propertyId }),
      setActivityFilter: (activityFilter) => patch({ activityFilter }),
      setInboxFilter: (inboxFilter) => patch({ inboxFilter }),
      confirmInspection: () => {
        patch({ inspectionConfirmed: true });
        void tenantApi
          .createMessage({
            subject: 'Routine inspection',
            body: 'I can attend the scheduled inspection.',
            department: 'INSPECTION',
            ...(state.propertyUuid ? { propertyId: state.propertyUuid } : {}),
          })
          .then(() => notify('Attendance sent to your property manager'))
          .catch((err) => notify(failureMessage(err, 'Could not confirm attendance')));
      },
      respondRenewal: () => {
        patch({ renewalResponded: true });
        notify('Response recorded. This is not a signed lease.');
      },
      setCleaning: (cleaning) => {
        patch({ cleaning });
        const caseId = state.vacating?.id;
        if (!caseId) return;
        const choice = cleaning === 'Crossub Cleaning' ? 'booked' : 'own_arrangement';
        void tenantApi.setCleaning(caseId, choice).catch((err) => notify(failureMessage(err, 'Could not save the cleaning choice')));
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
      addMaintenance: async (title, urgent, photos, video) => {
        const trimmed = title.trim();
        const files = video.trim() && photos.length === 0 ? [] : photos;
        if (!trimmed) {
          notify('Describe the issue first');
          return null;
        }
        if (files.length === 0) {
          notify('Add at least one photo or video');
          return null;
        }
        if (!current) {
          notify('This tenancy has ended. New requests are closed.');
          return null;
        }
        try {
          const urls: string[] = [];
          for (const file of files) urls.push((await tenantApi.uploadMaintenancePhoto(file)).url);
          const created = await tenantApi.createMaintenance({
            description: trimmed,
            urgent,
            photos: urls,
            ...(state.propertyUuid ? { propertyId: state.propertyUuid } : {}),
          });
          const tracking = created.orderNumber || created.id.slice(0, 8);
          await refreshAccount();
          notify(`${tracking} issued.`);
          return tracking;
        } catch (err) {
          notify(failureMessage(err, 'Could not submit the repair'));
          return null;
        }
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
        const caseId = state.vacating?.id;
        if (!caseId) {
          notify('No vacating case is open on this account.');
          return false;
        }
        void (async () => {
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
        })();
        return true;
      },
      markNoticeRead: (id) => {
        patch({ notices: state.notices.map((item) => (item.id === id ? { ...item, read: true } : item)) });
        void tenantApi.markNotificationRead(id).catch((err) => notify(failureMessage(err, 'Could not mark that notification read')));
      },
      markThreadRead: (id) => {
        patch({ threads: state.threads.map((item) => (item.id === id ? { ...item, unread: false } : item)) });
        void tenantApi.markMessageRead(id).catch(() => undefined);
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
      sendChat: async (threadId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return false;
        const thread = state.threads.find((item) => item.id === threadId);
        if (thread?.status === 'Completed') {
          notify('This conversation is closed. Start a new enquiry.');
          return false;
        }
        try {
          await tenantApi.replyMessage(threadId, trimmed);
          patch({ replies: { ...state.replies, [threadId]: trimmed } });
          return true;
        } catch (err) {
          notify(failureMessage(err, 'Could not send the message'));
          return false;
        }
      },
      createThread: async ({ category, subject, body, attachment }) => {
        if (!subject.trim() || !body.trim()) {
          notify('Add a subject and a message');
          return '';
        }
        const note = attachment?.trim() ? `\n\nAttachment: ${attachment.trim()}` : '';
        try {
          const created = await tenantApi.createMessage({
            subject: subject.trim(),
            body: `${body.trim()}${note}`,
            department: departmentFor(category),
            ...(state.propertyUuid ? { propertyId: state.propertyUuid } : {}),
          });
          await refreshAccount();
          notify(`Sent to ${scenario.team}`);
          return created.id;
        } catch (err) {
          notify(failureMessage(err, 'Could not send the message'));
          return '';
        }
      },
      submitCheckIn: async (input) => {
        if (!input.name.trim() || !input.email.includes('@') || !input.phone.trim()) {
          return 'Enter your name, email, and phone number.';
        }
        if (!input.sessionId) return 'This check-in link is missing the inspection session.';
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
        }
      },
      submitApplication: async (input) => {
        const income = Number(String(input.employment).replace(/[^0-9.]/g, '')) || 0;
        const employment = input.employment.toLowerCase();
        const employmentStatus = employment.includes('self')
          ? 'self_employed'
          : employment.includes('retir')
            ? 'retired'
            : employment.includes('unemploy')
              ? 'unemployed'
              : 'employed';
        try {
          const { submitGuestApplication } = await import('@/src/api/listings');
          const created = await submitGuestApplication(input.propertyId, {
            fullName: input.applicantName,
            email: input.email,
            phone: input.phone,
            annualIncome: income,
            employmentStatus,
            moveInDate: new Date().toISOString().slice(0, 10),
            formData: { ...input },
          });
          const record: ApplicationRecord = {
            ...input,
            id: created.id,
            reference: created.reference,
            submittedAt: 'Today',
            status: 'submitted',
            missingDocuments: [],
          };
          patch({ applications: [record, ...state.applications] });
          notify(`Application ${record.reference} submitted`);
          return created.id;
        } catch (err) {
          notify(failureMessage(err, 'Could not submit the application'));
          return '';
        }
      },
      uploadApplicationDocument: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          notify('Name the document first');
          return;
        }
        patch({
          applications: state.applications.map((item) => {
            if (item.id !== id) return item;
            const missingDocuments = item.missingDocuments.filter((doc) => doc !== trimmed);
            return {
              ...item,
              documents: item.documents.includes(trimmed) ? item.documents : [...item.documents, trimmed],
              missingDocuments,
              status: missingDocuments.length === 0 && item.status === 'missing_information' ? 'submitted' : item.status,
            };
          }),
        });
        notify('Document uploaded — pending review');
      },
      uploadOnboardingProof: (stepId, file) => {
        if (stepId !== 'deposit' && stepId !== 'bond') return 'This step does not take a receipt upload.';
        void (async () => {
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
        })();
        return null;
      },
      confirmOnboarding: (stepId) => {
        if (stepId === 'lease_signing') {
          void tenantApi
            .recordLeaseSigning()
            .then(() => {
              patch({ onboarding: { ...state.onboarding, [stepId]: 'completed' } });
              notify('Lease acceptance sent');
            })
            .catch((err) => notify(failureMessage(err, 'Could not record the lease signing')));
          return;
        }
        patch({ onboarding: { ...state.onboarding, [stepId]: 'completed' } });
        notify('Step updated');
      },
      finishTutorial: () => {
        patch({ tutorialDone: true });
        notify('Tutorial complete');
      },
      finishGuide: () => {
        patch({ guideSeen: true });
        void tenantApi.acknowledgeWelcome().catch((err) => notify(failureMessage(err, 'Could not save the welcome guide')));
      },
      acceptAgreement: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return 'Enter your full legal name.';
        void tenantApi
          .recordLeaseSigning()
          .then(() => {
            patch({ agreementName: trimmed });
            notify('Agreement acceptance sent');
          })
          .catch((err) => notify(failureMessage(err, 'Could not record the agreement')));
        return null;
      },
      acceptRentReview: () => {
        const review = state.rentReview;
        if (!review) {
          notify('No rent review is open on this account.');
          return;
        }
        void tenantApi
          .respondRentReview(review.id, {
            decision: 'accept',
            respondingToOfferId: review.offerId,
            expectedVersion: review.version,
          })
          .then(async () => {
            patch({ rentReviewStatus: 'accepted', rentReviewCounter: null });
            notify('Rent increase accepted. This does not sign the lease.');
            await refreshAccount();
          })
          .catch((err) => notify(failureMessage(err, 'Could not accept the rent review')));
      },
      counterRentReview: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return 'Enter a weekly amount.';
        const review = state.rentReview;
        if (!review) return 'No rent review is open on this account.';
        void tenantApi
          .respondRentReview(review.id, {
            decision: 'counter',
            counterWeekly: amount,
            respondingToOfferId: review.offerId,
            expectedVersion: review.version,
          })
          .then(async () => {
            patch({ rentReviewStatus: 'countered', rentReviewCounter: amount });
            notify('Counter-offer sent');
            await refreshAccount();
          })
          .catch((err) => notify(failureMessage(err, 'Could not send the counter-offer')));
        return null;
      },
      vacateFromRentReview: (date) => {
        if (!date.trim()) return 'Enter the date you plan to vacate.';
        const review = state.rentReview;
        if (!review) return 'No rent review is open on this account.';
        void tenantApi
          .respondRentReview(review.id, {
            decision: 'decline',
            moveOutDate: date.trim(),
            respondingToOfferId: review.offerId,
            expectedVersion: review.version,
          })
          .then(async () => {
            patch({ rentReviewStatus: 'vacating', rentReviewMoveOut: date.trim() });
            notify('Notice to vacate sent');
            await refreshAccount();
          })
          .catch((err) => notify(failureMessage(err, 'Could not send notice to vacate')));
        return null;
      },
      confirmTermination: (date) => {
        if (!date.trim()) return 'Select a move-out date.';
        void tenantApi
          .createVacating({
            expectedVacateDate: date.trim(),
            ...(state.propertyUuid ? { propertyId: state.propertyUuid } : {}),
          })
          .then(async () => {
            patch({ terminationMoveOut: date.trim(), terminationStarted: true });
            notify('Vacating case opened');
            await refreshAccount();
          })
          .catch((err) => notify(failureMessage(err, 'Could not open the vacating case')));
        return null;
      },
      requestMoving: () => {
        patch({ movingRequested: true });
        notify('Moving request recorded. Crossub will contact you.');
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
