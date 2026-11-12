export type ScenarioId = 'crossub' | 'agent-trust' | 'self-agent' | 'self-accounting';
export type PropertyId = 'berry' | 'halifax';
export type ActivityFilter = 'Action Required' | 'In Progress' | 'History';
export type InboxFilter = 'All' | 'Unread' | 'Maintenance' | 'Inspection' | 'Leasing' | 'General';
export type KeyMode = 'Crossub Booking' | 'Agent Record Only' | 'Agent Booking';
export type CleaningChoice = 'Crossub Cleaning' | "Agent's Cleaner" | 'Tenant Arranged';
export type FindingResponse = 'Accept' | 'Dispute';
export type ThreadStatus = 'Open' | 'Completed';

export type Scenario = {
  id: ScenarioId;
  label: string;
  ledger: boolean;
  team: string;
  trustName: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'crossub',
    label: 'Full Service · Crossub Trust',
    ledger: true,
    team: 'Crossub Management',
    trustName: 'Crossub Trust Account',
  },
  {
    id: 'agent-trust',
    label: 'Full Service · Agent Trust',
    ledger: false,
    team: 'Crossub Management',
    trustName: 'Agency Trust Account',
  },
  {
    id: 'self-agent',
    label: 'Self-Manage · Agent Trust',
    ledger: false,
    team: 'Your Agency',
    trustName: 'Agency Trust Account',
  },
  {
    id: 'self-accounting',
    label: 'Self-Manage · Crossub Accounting',
    ledger: true,
    team: 'Your Agency',
    trustName: 'Crossub Trust Account',
  },
];

export type Property = {
  id: PropertyId;
  title: string;
  place: string;
  status: 'Current' | 'Previous';
  type: string;
  start: string;
  end: string;
  rent: number;
  frequency: string;
  extras: string;
};

export const PROPERTIES: Record<PropertyId, Property> = {
  berry: {
    id: 'berry',
    title: '1205 / 88 Berry Street',
    place: 'North Sydney NSW 2060',
    status: 'Current',
    type: 'Fixed term',
    start: '15 Dec 2026',
    end: '14 Dec 2027',
    rent: 1200,
    frequency: 'Weekly',
    extras: '1 parking space · 1 storage cage',
  },
  halifax: {
    id: 'halifax',
    title: '1008 / 19 Halifax Street',
    place: 'Macquarie Park NSW',
    status: 'Previous',
    type: 'Fixed term',
    start: '1 Jul 2024',
    end: '30 Jun 2025',
    rent: 950,
    frequency: 'Weekly',
    extras: '1 parking space',
  },
};

export const ROOMS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'] as const;

export const FINDINGS = [
  { id: 0, name: 'Oven cleaning', amount: 120 },
  { id: 1, name: 'Bedroom wall damage', amount: 180 },
  { id: 2, name: 'Missing access card', amount: 80 },
] as const;

export type Thread = {
  id: string;
  category: 'Maintenance' | 'Inspection' | 'Leasing' | 'General';
  subject: string;
  preview: string;
  status: ThreadStatus;
  route: string;
  caseRoute?: string;
  unread?: boolean;
  attachment?: string;
};

export const SEED_THREADS: Thread[] = [
  {
    id: 'tap',
    category: 'Maintenance',
    subject: 'Kitchen tap repair',
    preview: 'Your contractor is being arranged',
    status: 'Open',
    route: '/flow/conversation?thread=tap',
    caseRoute: '/flow/maintenance',
    unread: true,
    attachment: 'tap-photo.jpg',
  },
  {
    id: 'inspect',
    category: 'Inspection',
    subject: 'Routine inspection',
    preview: 'Please confirm your availability',
    status: 'Open',
    route: '/flow/conversation?thread=inspect',
    caseRoute: '/flow/inspection',
    unread: true,
  },
  {
    id: 'parking',
    category: 'General',
    subject: 'Parking remote enquiry',
    preview: 'We have received your enquiry',
    status: 'Open',
    route: '/flow/conversation?thread=parking',
  },
  {
    id: 'renew',
    category: 'Leasing',
    subject: 'Lease renewal',
    preview: 'Your offer is ready to review',
    status: 'Open',
    route: '/flow/renewal',
  },
];

export function money(amount: number) {
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function scenarioById(id: ScenarioId) {
  return SCENARIOS.find((item) => item.id === id) ?? SCENARIOS[0];
}
