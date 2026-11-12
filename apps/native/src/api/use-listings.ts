import { useEffect, useState } from 'react';

import { loadPublicListing, loadPublicListings } from '@/src/api/listings';
import type { Listing } from '@/src/demo/listings';

export function usePublicListings() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadPublicListings()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load listings'));
  }, []);
  return { items, error };
}

export function usePublicListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) {
      setListing(null);
      return;
    }
    loadPublicListing(id)
      .then(setListing)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load this listing');
        setListing(null);
      });
  }, [id]);
  return { listing, error };
}
