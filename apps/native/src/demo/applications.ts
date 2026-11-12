export type ApplicationStatus = 'submitted' | 'missing_information' | 'approved' | 'declined';

export type ApplicationRecord = {
  id: string;
  reference: string;
  propertyId: string;
  propertyAddress: string;
  status: ApplicationStatus;
  submittedAt: string;
  applicantName: string;
  email: string;
  phone: string;
  leaseTerm: string;
  occupants: string;
  employment: string;
  documents: string[];
  missingDocuments: string[];
};

export const SEED_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'app-walker',
    reference: 'TA-1108',
    propertyId: 'walker-42',
    propertyAddress: '42 Walker Street',
    status: 'approved',
    submittedAt: '28 Oct 2026, 9:40 am',
    applicantName: 'Daniel Zhou',
    email: 'daniel@example.com',
    phone: '0400 111 222',
    leaseTerm: '12',
    occupants: '2 adults',
    employment: 'Full time · $96,000',
    documents: ['Photo ID', 'Proof of income', 'Rental ledger'],
    missingDocuments: [],
  },
  {
    id: 'app-halifax',
    reference: 'TA-1042',
    propertyId: 'halifax-19',
    propertyAddress: '1008 / 19 Halifax Street',
    status: 'missing_information',
    submittedAt: '2 Nov 2026, 4:15 pm',
    applicantName: 'Daniel Zhou',
    email: 'daniel@example.com',
    phone: '0400 111 222',
    leaseTerm: '12',
    occupants: '1 adult',
    employment: 'Full time · $96,000',
    documents: ['NSW application form'],
    missingDocuments: ['Photo ID', 'Proof of income'],
  },
];

export type OnboardingStepId = 'deposit' | 'bond' | 'lease_signing' | 'key_pickup' | 'account_setup' | 'ingoing_report';
export type OnboardingStatus = 'pending' | 'uploaded' | 'completed';

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  kind: 'upload' | 'confirm';
  amount?: number;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'deposit',
    title: 'Holding deposit',
    description: 'Pay the holding deposit and upload proof so leasing can confirm it.',
    kind: 'upload',
    amount: 3000,
  },
  {
    id: 'bond',
    title: 'Rental bond',
    description: 'Lodge the bond as your agent instructs, then upload proof.',
    kind: 'upload',
    amount: 6000,
  },
  {
    id: 'lease_signing',
    title: 'Lease signing',
    description: 'Read the residential tenancy agreement and confirm you accept it.',
    kind: 'confirm',
  },
  {
    id: 'key_pickup',
    title: 'Key collection',
    description: 'Collect the keys and confirm handover.',
    kind: 'confirm',
  },
  {
    id: 'account_setup',
    title: 'Account setup',
    description: 'Confirm the email on this tenancy is the one you will use to sign in.',
    kind: 'confirm',
  },
  {
    id: 'ingoing_report',
    title: 'Ingoing report',
    description: 'Confirm the ingoing condition report section by section when your agent sends it.',
    kind: 'confirm',
  },
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  missing_information: 'Missing information',
  approved: 'Approved',
  declined: 'Declined',
};

export const ONBOARDING_LABEL: Record<OnboardingStatus, string> = {
  pending: 'Not started',
  uploaded: 'Pending confirmation',
  completed: 'Done',
};

export function emptyOnboarding(): Record<OnboardingStepId, OnboardingStatus> {
  return {
    deposit: 'pending',
    bond: 'pending',
    lease_signing: 'pending',
    key_pickup: 'pending',
    account_setup: 'pending',
    ingoing_report: 'pending',
  };
}
