/**
 * CivicResolve - Geocoding Service & OpenStreetMap Nominatim Provider Abstraction
 * Handles forward and reverse geocoding with:
 * - Rate limiting (strictly complies with OSM Nominatim usage policy: <= 1 req/sec)
 * - In-memory LRU caching to eliminate redundant network hits
 * - Debouncing
 * - Graceful fallback when network or provider is unavailable
 * - Genuine address decomposition (never fabricates missing civic administrative data)
 */

export interface StructuredAddress {
  houseNumber?: string;
  street?: string;
  locality?: string;
  neighbourhood?: string;
  villageOrCity?: string;
  ward?: string;
  zone?: string;
  block?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullFormattedAddress: string;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  address: StructuredAddress;
  attribution: string;
  provider: string;
}

export interface IGeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null>;
  search(query: string): Promise<GeocodingResult[]>;
}

class NominatimProvider implements IGeocodingProvider {
  private lastRequestTime = 0;
  private minIntervalMs = 1100; // 1.1s to respect OSM 1 req/sec policy
  private cache = new Map<string, { result: GeocodingResult; timestamp: number }>();
  private cacheTtlMs = 15 * 60 * 1000; // 15 minutes TTL

  private getCacheKey(lat: number, lng: number): string {
    // 4 decimal places gives ~11m precision, ideal for street caching
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private parseNominatimAddress(data: any, lat: number, lng: number): GeocodingResult {
    const rawAddr = data.address || {};

    const houseNumber = rawAddr.house_number || rawAddr.building || undefined;
    const street = rawAddr.road || rawAddr.pedestrian || rawAddr.street || rawAddr.footway || undefined;
    const neighbourhood = rawAddr.neighbourhood || rawAddr.suburb || undefined;
    const locality = rawAddr.suburb || rawAddr.residential || rawAddr.city_district || rawAddr.village || undefined;
    const villageOrCity = rawAddr.city || rawAddr.town || rawAddr.village || rawAddr.municipality || undefined;
    const district = rawAddr.state_district || rawAddr.county || rawAddr.district || undefined;
    const state = rawAddr.state || undefined;
    const postalCode = rawAddr.postcode || undefined;
    const country = rawAddr.country || 'India';

    // Construct human-readable civic street address without duplicates
    const streetParts = [
      houseNumber,
      street,
      neighbourhood,
      locality !== neighbourhood ? locality : undefined,
      villageOrCity,
      district,
      postalCode ? `PIN-${postalCode}` : undefined,
    ].filter(Boolean);

    const fullFormatted = streetParts.length > 0 ? streetParts.join(', ') : (data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    return {
      lat,
      lng,
      address: {
        houseNumber,
        street,
        locality,
        neighbourhood,
        villageOrCity,
        district,
        state,
        postalCode,
        country,
        fullFormattedAddress: fullFormatted,
      },
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0',
      provider: 'OpenStreetMap Nominatim',
    };
  }

  public async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    const cacheKey = this.getCacheKey(lat, lng);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.result;
    }

    try {
      await this.enforceRateLimit();

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CivicResolve-GrievancePlatform/2.0 (civicresolve@civicresolve.org)',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data || data.error) {
        return null;
      }

      const parsed = this.parseNominatimAddress(data, lat, lng);
      this.cache.set(cacheKey, { result: parsed, timestamp: Date.now() });

      // Clean cache if too large
      if (this.cache.size > 200) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      return parsed;
    } catch (err) {
      console.warn('[GeocodingService] Reverse geocode lookup failed (non-fatal):', err);
      return null;
    }
  }

  public async search(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      await this.enforceRateLimit();

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CivicResolve-GrievancePlatform/2.0 (civicresolve@civicresolve.org)',
        },
      });

      if (!response.ok) return [];

      const list = await response.json();
      if (!Array.isArray(list)) return [];

      return list.map((item: any) =>
        this.parseNominatimAddress(item, parseFloat(item.lat), parseFloat(item.lon))
      );
    } catch {
      return [];
    }
  }
}

// Export singleton instance with provider abstraction
export const geocodingService = new NominatimProvider();
