export interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  village?: string;
  city?: string;
  county?: string;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const MIN_QUERY_LENGTH = 3;

export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<NominatimResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "5",
    addressdetails: "1",
  });

  const res = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
    headers: {
      "User-Agent": "GardenSchedule/1.0",
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Address search failed (HTTP ${res.status})`);
  }

  return res.json() as Promise<NominatimResult[]>;
}
