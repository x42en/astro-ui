import api from '../lib/axios';

/**
 * Catalogue object as returned by `/api/v1/catalog/*` endpoints.
 *
 * Coordinates are J2000 decimal degrees. ``source`` distinguishes entries
 * coming from the bundled offline catalogue from those resolved live via
 * SIMBAD, which the UI may surface visually.
 */
export interface CatalogObject {
  id: string;
  name: string;
  type: 'galaxy' | 'cluster' | 'nebula' | 'planetary' | 'supernova' | 'other';
  constellation: string;
  ra_deg: number;
  dec_deg: number;
  magnitude: number | null;
  source: 'bundled' | 'simbad';
}

export interface CatalogObjectListResponse {
  items: CatalogObject[];
  total: number;
}

/**
 * Search the bundled offline catalogue.
 *
 * @param q - Free-text query (id or name fragment); empty returns full list.
 * @param limit - Maximum number of results.
 */
export async function searchCatalog(
  q: string = '',
  limit: number = 200,
): Promise<CatalogObjectListResponse> {
  const response = await api.get<CatalogObjectListResponse>('/catalog/objects', {
    params: { q, limit },
  });
  return response.data;
}

/**
 * Resolve a single object name to coordinates, using SIMBAD as a fallback
 * when the name is not in the bundled catalogue.
 *
 * Returns ``null`` instead of throwing when the object cannot be resolved
 * (404 or transient SIMBAD failure) so the UI can keep accepting manual
 * RA/Dec entry without surfacing a noisy error.
 */
export async function resolveObject(name: string): Promise<CatalogObject | null> {
  try {
    const response = await api.get<CatalogObject>('/catalog/resolve', {
      params: { name },
    });
    return response.data;
  } catch {
    return null;
  }
}
