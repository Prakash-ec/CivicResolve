/**
 * CivicResolve - Live GPS Location Service
 * Implements browser Geolocation API with:
 * - Explicit opt-in consent model (never collects in background or without consent)
 * - Acquisition state machine
 * - Accuracy classification (High <25m, Medium 25-100m, Low >100m)
 * - Watcher lifecycle management with explicit stop controls
 * - Robust error handling (permission denied, timeout, position unavailable)
 * - Reverse geocoding integration
 */

import { geocodingService, GeocodingResult } from './geocodingService.js';

export type LocationAcquisitionStatus =
  | 'idle'
  | 'prompting'
  | 'requesting'
  | 'tracking'
  | 'acquired'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

export type AccuracyLevel = 'high' | 'medium' | 'low';

export interface GpsCoordinates {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  accuracyLevel: AccuracyLevel;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface UserLocationState {
  status: LocationAcquisitionStatus;
  coords: GpsCoordinates | null;
  geocoded: GeocodingResult | null;
  error: string | null;
  lastUpdated: string | null;
  isWatching: boolean;
}

export class LocationService {
  private activeWatchId: number | null = null;
  private highAccuracyOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 10000,
  };

  /**
   * Evaluates if the host runtime supports standard W3C Geolocation API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Evaluates accuracy level in meters
   */
  public evaluateAccuracyLevel(accuracyMeters: number): AccuracyLevel {
    if (accuracyMeters <= 25) return 'high';
    if (accuracyMeters <= 100) return 'medium';
    return 'low';
  }

  /**
   * Prompts user for explicit GPS coordinates once
   */
  public async getCurrentPosition(): Promise<GpsCoordinates> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by your current browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const accuracy = Math.round(pos.coords.accuracy);
          const coords: GpsCoordinates = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy,
            accuracyLevel: this.evaluateAccuracyLevel(accuracy),
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
          };
          resolve(coords);
        },
        (err) => {
          let message = 'Unable to acquire GPS coordinates.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission was denied. You can select your address manually on the map.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'GPS signal is currently unavailable. Please click or search on the map.';
          } else if (err.code === err.TIMEOUT) {
            message = 'GPS acquisition timed out. Please retry or pick your location manually.';
          }
          const customError: any = new Error(message);
          customError.code = err.code;
          reject(customError);
        },
        this.highAccuracyOptions
      );
    });
  }

  /**
   * Starts live location tracking watcher
   * Note: Strictly requires prior explicit user consent!
   */
  public startWatch(
    onSuccess: (coords: GpsCoordinates) => void,
    onError: (err: any) => void
  ): boolean {
    if (!this.isSupported()) {
      onError(new Error('Geolocation is not supported by your browser.'));
      return false;
    }

    this.stopWatch(); // ensure clean state

    this.activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy);
        const coords: GpsCoordinates = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy,
          accuracyLevel: this.evaluateAccuracyLevel(accuracy),
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };
        onSuccess(coords);
      },
      (err) => {
        onError(err);
      },
      this.highAccuracyOptions
    );

    return true;
  }

  /**
   * Stops active GPS watcher and frees device hardware sensors
   */
  public stopWatch(): void {
    if (this.activeWatchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.activeWatchId);
      this.activeWatchId = null;
    }
  }

  /**
   * Checks whether a live watch is currently running
   */
  public isWatching(): boolean {
    return this.activeWatchId !== null;
  }

  /**
   * Combines GPS acquisition with reverse geocoding
   */
  public async getResolvedLocation(): Promise<{ coords: GpsCoordinates; geocoded: GeocodingResult | null }> {
    const coords = await this.getCurrentPosition();
    const geocoded = await geocodingService.reverseGeocode(coords.lat, coords.lng);
    return { coords, geocoded };
  }
}

export const locationService = new LocationService();
