import type { components } from '@crossub-thongz/api-contract';

export const SUPPORTING_POINTS_MIN = 40;

export const APPLICATION_DOCUMENT_SLOTS: {
  category: components['schemas']['PublicApplicationDocumentDto']['category'];
  documentType: string;
  label: string;
  points: number;
}[] = [
  { category: 'identity', documentType: 'drivers_licence', label: "Driver's licence", points: 30 },
  { category: 'identity', documentType: 'passport', label: 'Passport', points: 30 },
  { category: 'identity', documentType: 'birth_certificate_photo_id', label: 'Birth certificate + photo ID', points: 30 },
  { category: 'income', documentType: 'pay_advice', label: 'Last pay advice', points: 30 },
  { category: 'income', documentType: 'centrelink_statement', label: 'Current Centrelink statement', points: 30 },
  { category: 'income', documentType: 'bank_statement', label: 'Current bank statement', points: 30 },
  { category: 'supporting', documentType: 'rental_ledger', label: 'Current rental ledger (from agent)', points: 40 },
  { category: 'supporting', documentType: 'rent_receipts', label: 'Last two rent receipts', points: 20 },
  { category: 'supporting', documentType: 'written_references', label: 'Two written references', points: 20 },
  { category: 'supporting', documentType: 'rates_notice', label: 'Recent rates notice', points: 30 },
  { category: 'supporting', documentType: 'vehicle_registration', label: 'Vehicle registration papers', points: 10 },
  { category: 'supporting', documentType: 'utility_bill', label: 'Current electricity or phone account', points: 10 },
];
