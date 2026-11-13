import type { components } from '@crossub-thongz/api-contract';

import { crossub, unwrap } from '@/src/api/client';
import { apiJson } from '@/src/api/http';
import type { Listing } from '@/src/demo/listings';

type PublicListingDto = components['schemas']['PublicListingResponseDto'];

function label(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase().replaceAll('_', ' ');
}

function when(start: string | null, end: string | null): string | undefined {
  if (!start) return undefined;
  const opened = new Date(start);
  if (Number.isNaN(opened.getTime())) return start;
  const startText = opened.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  if (!end) return startText;
  const closed = new Date(end);
  if (Number.isNaN(closed.getTime())) return startText;
  const endText = closed.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  return `${startText}–${endText}`;
}

export function mapListing(dto: PublicListingDto): Listing {
  return {
    id: dto.id,
    address: dto.address,
    suburb: dto.suburb ?? '',
    rentWeekly: dto.rentWeekly ?? null,
    bondAmount: dto.bondAmount ?? undefined,
    depositAmount: dto.depositAmount ?? undefined,
    propertyType: label(dto.propertyType || 'Property'),
    bedrooms: dto.bedrooms ?? 0,
    bathrooms: dto.bathrooms ?? 0,
    parking: dto.parking ?? undefined,
    availableFrom: dto.availableFrom ? dto.availableFrom.slice(0, 10) : 'TBC',
    leaseTerm: dto.leaseTerm ?? undefined,
    openInspection: when(dto.openInspectionAt ?? null, dto.openInspectionEndAt ?? null),
    features: dto.features ?? [],
    status: dto.acceptingApplications ? 'Showing' : dto.status,
    canApply: dto.acceptingApplications,
  };
}

let cache: Promise<Listing[]> | null = null;

export function loadPublicListings(force = false): Promise<Listing[]> {
  if (!cache || force) {
    cache = unwrap(crossub.GET('/public/listings'))
      .then((body) => body.items.map(mapListing))
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export async function loadPublicListing(id: string): Promise<Listing | null> {
  const all = await loadPublicListings();
  return all.find((item) => item.id === id) ?? null;
}

export type GuestApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  annualIncome: number;
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired';
  moveInDate: string;
  viewingSessionId?: string;
  formData?: Record<string, unknown>;
};

export function submitGuestApplication(propertyId: string, body: GuestApplicationInput) {
  return unwrap(
    crossub.POST('/public/listings/{propertyId}/applications', {
      params: { path: { propertyId } },
      body,
    }),
  );
}

export function submitOpenViewingCheckIn(
  sessionId: string,
  body: { name: string; email: string; phone: string; notes?: string; leaseTerm?: string; pets?: string; comments?: string },
) {
  return apiJson<{ ok: true }>(
    `/api/open-viewings/public/sessions/${encodeURIComponent(sessionId)}/register`,
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
}
