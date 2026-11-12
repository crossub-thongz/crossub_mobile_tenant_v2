export type Listing = {
  id: string;
  address: string;
  suburb: string;
  rentWeekly: number | null;
  bondAmount?: number;
  depositAmount?: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  parking?: number;
  availableFrom: string;
  leaseTerm?: string;
  openInspection?: string;
  sessionId?: string;
  features: string[];
  status: string;
  canApply: boolean;
};

export const LISTINGS: Listing[] = [
  {
    id: 'berry-88',
    address: '1205 / 88 Berry Street',
    suburb: 'North Sydney NSW 2060',
    rentWeekly: 1200,
    bondAmount: 4800,
    depositAmount: 1200,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    availableFrom: '15 Dec 2026',
    leaseTerm: '12 months',
    openInspection: 'Sat 14 Nov 2026, 10:00–10:30 am',
    sessionId: 'oi-berry',
    features: ['1 parking space', '1 storage cage', 'Lift access', 'Air conditioning'],
    status: 'Showing',
    canApply: true,
  },
  {
    id: 'halifax-19',
    address: '1008 / 19 Halifax Street',
    suburb: 'Macquarie Park NSW 2113',
    rentWeekly: 950,
    bondAmount: 3800,
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    availableFrom: '1 Dec 2026',
    leaseTerm: '12 months',
    openInspection: 'Sun 15 Nov 2026, 11:00–11:20 am',
    sessionId: 'oi-halifax',
    features: ['1 parking space', 'Balcony', 'Internal laundry'],
    status: 'Showing',
    canApply: true,
  },
  {
    id: 'walker-42',
    address: '42 Walker Street',
    suburb: 'North Sydney NSW 2060',
    rentWeekly: 1500,
    bondAmount: 6000,
    propertyType: 'House',
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    availableFrom: '1 Jan 2027',
    leaseTerm: '12 months',
    features: ['Courtyard', 'Study nook', 'Gas cooking'],
    status: 'Vacant',
    canApply: true,
  },
  {
    id: 'pacific-7',
    address: '7 Pacific Highway',
    suburb: 'St Leonards NSW 2065',
    rentWeekly: null,
    propertyType: 'Apartment',
    bedrooms: 1,
    bathrooms: 1,
    availableFrom: 'TBC',
    features: ['Building gym'],
    status: 'Occupied',
    canApply: false,
  },
];

export function listingById(id: string) {
  return LISTINGS.find((item) => item.id === id) ?? null;
}
