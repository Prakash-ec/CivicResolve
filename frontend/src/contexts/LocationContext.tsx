import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  locationService,
  GpsCoordinates,
  LocationAcquisitionStatus,
} from '../services/locationService.js';
import { geocodingService, StructuredAddress } from '../services/geocodingService.js';

const STORAGE_COORDS_KEY = 'civicresolve_cached_coords';
const STORAGE_ADDR_KEY = 'civicresolve_cached_address';

interface LocationContextType {
  status: LocationAcquisitionStatus;
  coords: GpsCoordinates | null;
  address: StructuredAddress | null;
  error: string | null;
  isLiveTracking: boolean;
  isPermissionDialogOpen: boolean;
  lastAcquiredAt: Date | null;
  isSupported: boolean;
  openPermissionDialog: () => void;
  closePermissionDialog: () => void;
  requestLocation: () => Promise<GpsCoordinates | null>;
  startLiveTracking: () => Promise<boolean>;
  stopLiveTracking: () => void;
  refreshLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, addressText?: string) => Promise<void>;
  fetchLocationIfActive: (force?: boolean) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<LocationAcquisitionStatus>('idle');
  
  // Initialize with cached coordinates from previous session if available
  const [coords, setCoords] = useState<GpsCoordinates | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_COORDS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [address, setAddress] = useState<StructuredAddress | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_ADDR_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [lastAcquiredAt, setLastAcquiredAt] = useState<Date | null>(() => coords ? new Date() : null);

  const isSupported = locationService.isSupported();
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Sync coords to localStorage cache
  useEffect(() => {
    if (coords) {
      try {
        localStorage.setItem(STORAGE_COORDS_KEY, JSON.stringify(coords));
      } catch {}
    }
  }, [coords]);

  // Sync address to localStorage cache
  useEffect(() => {
    if (address) {
      try {
        localStorage.setItem(STORAGE_ADDR_KEY, JSON.stringify(address));
      } catch {}
    }
  }, [address]);

  // Clean up any watchers on unmount
  useEffect(() => {
    return () => {
      locationService.stopWatch();
    };
  }, []);

  const openPermissionDialog = useCallback(() => {
    setIsPermissionDialogOpen(true);
  }, []);

  const closePermissionDialog = useCallback(() => {
    setIsPermissionDialogOpen(false);
  }, []);

  // One-time explicit GPS acquisition
  const requestLocation = useCallback(async (): Promise<GpsCoordinates | null> => {
    if (!isSupported) {
      setStatus('unsupported');
      setError('Geolocation is not supported by your browser.');
      return null;
    }

    if (isFetchingRef.current) {
      return coords;
    }

    isFetchingRef.current = true;
    setStatus('requesting');
    setError(null);

    try {
      const acquiredCoords = await locationService.getCurrentPosition();
      setCoords(acquiredCoords);
      setStatus('acquired');
      setLastAcquiredAt(new Date());
      lastFetchTimeRef.current = Date.now();

      // Reverse geocode in background
      try {
        const geoResult = await geocodingService.reverseGeocode(
          acquiredCoords.lat,
          acquiredCoords.lng
        );
        if (geoResult) {
          setAddress(geoResult.address);
        }
      } catch {
        // Non-fatal
      }

      return acquiredCoords;
    } catch (err: any) {
      if (err.code === 1) {
        setStatus('denied');
        setError('Location access was denied. You can still set your address manually.');
      } else if (err.code === 3) {
        setStatus('timeout');
        setError('Location request timed out. Please retry or adjust map pin.');
      } else {
        setStatus('unavailable');
        setError(err.message || 'Unable to determine GPS location.');
      }
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, [isSupported, coords]);

  // Auto-fetch location whenever the website is active or visible
  const fetchLocationIfActive = useCallback(
    async (force = false) => {
      if (!isSupported) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      const now = Date.now();
      // 15-second throttle unless forced
      if (!force && now - lastFetchTimeRef.current < 15000) {
        return;
      }

      // Check permissions state if Permissions API is supported
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (perm.state === 'denied') {
            setStatus('denied');
            return;
          }
        } catch {
          // Permissions API query not supported in this environment, proceed
        }
      }

      await requestLocation();
    },
    [isSupported, requestLocation]
  );

  // Automatically fetch location when website is loaded / becomes active / gains focus
  useEffect(() => {
    // 1. Initial fetch when page loads and website is active
    fetchLocationIfActive(true);

    // 2. Fetch whenever user switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLocationIfActive();
      }
    };

    // 3. Fetch when the window gains focus
    const handleWindowFocus = () => {
      fetchLocationIfActive();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // 4. Listen to permission status transitions (e.g. user clicks "Allow" in browser bar)
    let permStatus: PermissionStatus | null = null;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          permStatus = status;
          permStatus.onchange = () => {
            if (permStatus?.state === 'granted') {
              fetchLocationIfActive(true);
            } else if (permStatus?.state === 'denied') {
              setStatus('denied');
            }
          };
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, [fetchLocationIfActive]);

  // Explicit continuous live tracking
  const startLiveTracking = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setStatus('unsupported');
      setError('Geolocation is not supported by your browser.');
      return false;
    }

    setStatus('tracking');
    setIsLiveTracking(true);
    setError(null);

    const success = locationService.startWatch(
      async (newCoords) => {
        setCoords(newCoords);
        setStatus('acquired');
        setLastAcquiredAt(new Date());
        lastFetchTimeRef.current = Date.now();

        try {
          const geoResult = await geocodingService.reverseGeocode(newCoords.lat, newCoords.lng);
          if (geoResult) {
            setAddress(geoResult.address);
          }
        } catch {
          // Ignore reverse geocode failures during fast tracking
        }
      },
      (err) => {
        setIsLiveTracking(false);
        if (err.code === 1) {
          setStatus('denied');
          setError('Live tracking stopped: GPS permission was revoked.');
        } else {
          setStatus('unavailable');
          setError('Live tracking interrupted: GPS signal lost.');
        }
      }
    );

    return success;
  }, [isSupported]);

  const stopLiveTracking = useCallback(() => {
    locationService.stopWatch();
    setIsLiveTracking(false);
    if (coords) {
      setStatus('acquired');
    } else {
      setStatus('idle');
    }
  }, [coords]);

  const refreshLocation = useCallback(async () => {
    await requestLocation();
  }, [requestLocation]);

  const setManualLocation = useCallback(
    async (lat: number, lng: number, addressText?: string) => {
      stopLiveTracking();
      const manualCoords: GpsCoordinates = {
        lat,
        lng,
        accuracy: 10,
        accuracyLevel: 'high',
        timestamp: Date.now(),
      };
      setCoords(manualCoords);
      setStatus('acquired');
      setLastAcquiredAt(new Date());

      if (addressText) {
        setAddress({
          fullFormattedAddress: addressText,
        });
      } else {
        const geoResult = await geocodingService.reverseGeocode(lat, lng);
        if (geoResult) {
          setAddress(geoResult.address);
        }
      }
    },
    [stopLiveTracking]
  );

  return (
    <LocationContext.Provider
      value={{
        status,
        coords,
        address,
        error,
        isLiveTracking,
        isPermissionDialogOpen,
        lastAcquiredAt,
        isSupported,
        openPermissionDialog,
        closePermissionDialog,
        requestLocation,
        startLiveTracking,
        stopLiveTracking,
        refreshLocation,
        setManualLocation,
        fetchLocationIfActive,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
