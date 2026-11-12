export type RentReviewStatus = 'pending' | 'accepted' | 'countered' | 'vacating';

export const RENT_REVIEW = {
  id: 'rr-berry',
  address: '1205 / 88 Berry Street',
  currentRent: 1200,
  proposedRent: 1260,
  effective: '15 Dec 2026',
  respondBy: '28 Nov 2026',
  negotiable: true,
};

export const TERMINATION = {
  address: '1205 / 88 Berry Street',
  reason: 'The landlord requires the property for their own housing. This notice gives the date you need to reply and the latest date to vacate.',
  respondBy: '5 Dec 2026',
  vacateDeadline: '19 Dec 2026',
};

export const ARREARS = {
  stage: 'Reminder',
  outstanding: 700,
  due: '9 Nov 2026',
  message: 'A $500 part payment is on the account. It does not complete the next rent week, so $700 is still outstanding.',
};

export const STATEMENT = {
  address: '1008 / 19 Halifax Street',
  finalized: '30 Jun 2025',
  bond: 3800,
  arrears: 0,
  bills: 80,
  deductions: 180,
};

export const LEASE_DOCUMENTS = [
  {
    id: 'agreement',
    name: 'Residential tenancy agreement',
    uploaded: '15 Dec 2026',
    body: 'Fixed term from 15 Dec 2026 to 14 Dec 2027. Weekly rent $1,200. One parking space and one storage cage are included. The signed copy is held by Crossub.',
  },
  {
    id: 'condition',
    name: 'Ingoing condition report',
    uploaded: '13 Nov 2026',
    body: 'Rooms recorded at the start of the tenancy. Your acknowledgement confirms you received this version. It is not agreement with every line.',
  },
  {
    id: 'notice',
    name: 'Notice of rent review',
    uploaded: '11 Nov 2026',
    body: 'Proposed rent $1,260 weekly from 15 Dec 2026. Respond from the rent review screen. Accepting here does not sign a new lease.',
  },
] as const;
