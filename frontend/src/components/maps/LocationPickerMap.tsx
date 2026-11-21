import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  AlertCircle,
  ExternalLink,
  Layers,
  Search,
  Crosshair,
  Compass,
  Eye,
  Route,
  Check,
  Copy,
  Sparkles,
  Map as MapIcon,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { geocodingService, StructuredAddress } from '../../services/geocodingService.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';

// Custom Pin Icon for CivicResolve (CivicLens Saffron Orange & Navy)
const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="background-color: #EA580C; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 6px 14px rgba(15,40,84,0.4);">
          <div style="width: 11px; height: 11px; background: #0F2854; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

// Map Layer Configurations
type MapLayerType = 'google_hybrid' | 'osm' | 'google_terrain';

const MAP_LAYERS: Record<
  MapLayerType,
  { name: string; url: string; attribution: string; maxZoom: number }
> = {
  google_hybrid: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  google_terrain: {
    name: 'Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
};

// Curated Popular Civic Landmarks for Fast Selection
const CIVIC_LANDMARKS = [
  { name: 'Sulur Bus Stand, Coimbatore', lat: 11.0267, lng: 77.1264, ward: 'Ward 01' },
  { name: 'Singanallur Junction, CCMC', lat: 11.0018, lng: 77.0143, ward: 'Ward 50' },
  { name: 'RS Puram Head Post Office, CCMC', lat: 11.0125, lng: 76.9450, ward: 'Ward 16' },
  { name: 'Gandhipuram Central Bus Stand', lat: 10.9980, lng: 76.9650, ward: 'Ward 32' },
  { name: 'Peelamedu Airport Road, CCMC', lat: 11.0480, lng: 76.9920, ward: 'Ward 08' },
  { name: 'Ripon Building, GCC Chennai', lat: 13.0827, lng: 80.2707, ward: 'Ward 058' },
  { name: 'Anna Nagar Roundtana, GCC', lat: 13.0850, lng: 80.2101, ward: 'Ward 102' },
];

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  accuracyMeters?: number;
  onLocationSelect: (lat: number, lng: number, accuracy?: number) => void;
  onAddressDetected?: (address: string, ward?: string, structured?: StructuredAddress) => void;
}

// Sub-component to handle map pan/recenter without re-mounting MapContainer
const MapPanController: React.FC<{
  position: [number, number];
  recenterTrigger: number;
}> = ({ position, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [position[0], position[1], recenterTrigger, map]);

  return null;
};

// Sub-component for Click Listener
const MapEventsController: React.FC<{
  onSelect: (lat: number, lng: number) => void;
}> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerProps> = ({
  initialLat = 11.0018,
  initialLng = 77.0143,
  accuracyMeters = 15,
  onLocationSelect,
  onAddressDetected,
}) => {
  const { coords: globalCoords, requestLocation, openPermissionDialog, isLiveTracking } = useCurrentLocation();

  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [accuracy, setAccuracy] = useState<number>(accuracyMeters);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('google_hybrid');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [detectedWard, setDetectedWard] = useState<string | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  const debounceTimerRef = useRef<any>(null);

  // Sync with global location if updated externally or when website is active
  useEffect(() => {
    if (globalCoords && (globalCoords.lat !== position[0] || globalCoords.lng !== position[1])) {
      setPosition([globalCoords.lat, globalCoords.lng]);
      setAccuracy(globalCoords.accuracy);
      setRecenterCount((c) => c + 1);
      onLocationSelect(globalCoords.lat, globalCoords.lng, globalCoords.accuracy);
      triggerReverseGeocode(globalCoords.lat, globalCoords.lng);
    }
  }, [globalCoords?.lat, globalCoords?.lng]);

  // Debounced reverse geocode handler
  const triggerReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setGeocodingLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await geocodingService.reverseGeocode(lat, lng);
          if (res) {
            const formatted = res.address.fullFormattedAddress;
            const wardCandidate = res.address.ward || res.address.locality || res.address.neighbourhood || '';

            setDetectedAddress(formatted);
            setDetectedWard(wardCandidate);

            if (onAddressDetected) {
              onAddressDetected(formatted, wardCandidate, res.address);
            }
          }
        } catch {
          // Graceful fallback
        } finally {
          setGeocodingLoading(false);
        }
      }, 500); // 500ms debounce
    },
    [onAddressDetected]
  );

  const handleMarkerDrag = (e: any) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    const newLat = Number(pos.lat.toFixed(6));
    const newLng = Number(pos.lng.toFixed(6));
    setPosition([newLat, newLng]);
    onLocationSelect(newLat, newLng, accuracy);
    triggerReverseGeocode(newLat, newLng);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const newLat = Number(lat.toFixed(6));
    const newLng = Number(lng.toFixed(6));
    setPosition([newLat, newLng]);
    onLocationSelect(newLat, newLng, accuracy);
    triggerReverseGeocode(newLat, newLng);
  };

  const handleUseCurrentLocation = async () => {
    setGpsError(null);
    setGpsLoading(true);
    try {
      const res = await requestLocation();
      if (res) {
        setPosition([res.lat, res.lng]);
        setAccuracy(res.accuracy);
        setRecenterCount((c) => c + 1);
        onLocationSelect(res.lat, res.lng, res.accuracy);
        triggerReverseGeocode(res.lat, res.lng);
      } else {
        openPermissionDialog();
      }
    } catch (err: any) {
      setGpsError(err.message || 'GPS location could not be acquired.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
  };

  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setGpsError(null);
    try {
      const results = await geocodingService.search(searchQuery);
      if (results.length > 0) {
        const top = results[0];
        setPosition([top.lat, top.lng]);
        setAccuracy(25);
        setRecenterCount((c) => c + 1);
        onLocationSelect(top.lat, top.lng, 25);
        setDetectedAddress(top.address.fullFormattedAddress);
        if (onAddressDetected) {
          onAddressDetected(top.address.fullFormattedAddress, top.address.ward, top.address);
        }
      } else {
        setGpsError(`No locations found for "${searchQuery}". Please click manually on the map.`);
      }
    } catch {
      setGpsError('Location search service temporarily unavailable. Please click on the map.');
    } finally {
      setSearching(false);
    }
  };

  const handleLandmarkSelect = (landmark: (typeof CIVIC_LANDMARKS)[0]) => {
    setPosition([landmark.lat, landmark.lng]);
    setAccuracy(20);
    setRecenterCount((c) => c + 1);
    onLocationSelect(landmark.lat, landmark.lng, 20);
    setDetectedAddress(landmark.name);
    setDetectedWard(landmark.ward);
    if (onAddressDetected) {
      onAddressDetected(landmark.name, landmark.ward);
    }
  };

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(`${position[0].toFixed(6)}, ${position[1].toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Google Maps Deep Integration Links
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`;
  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position[0]},${position[1]}`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;

  return (
    <div className="space-y-3">
      {/* Top Search & Actions Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <form onSubmit={handleSearchPlace} className="flex-1 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locality, street, or landmark..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2854]/20 focus:border-[#0F2854]"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={searching}
            className="shrink-0 bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-1.5"
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs px-3 py-1.5 shadow-sm flex items-center gap-1.5"
          >
            <Navigation className={`w-3.5 h-3.5 text-orange-400 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Current Location'}</span>
          </Button>
        </div>
      </div>

      {/* Curated Hotspots Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
        <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Hubs:
        </span>
        {CIVIC_LANDMARKS.map((lm) => (
          <button
            key={lm.name}
            type="button"
            onClick={() => handleLandmarkSelect(lm)}
            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 border border-slate-200 text-slate-700 text-[11px] shrink-0 transition-all font-medium"
          >
            {lm.name}
          </button>
        ))}
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Reverse Geocode Detected Address Notification Chip */}
      {detectedAddress && (
        <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 text-[#0F2854] text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 animate-ping" />
            <span className="font-bold text-[#0F2854] shrink-0">Auto-Resolved Address:</span>
            <span className="truncate text-slate-700 font-medium">{detectedAddress}</span>
          </div>
          {geocodingLoading && <span className="text-[10px] text-slate-400 italic">resolving...</span>}
        </div>
      )}

      {/* Map Display Frame */}
      <div className="h-72 sm:h-80 w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-card z-0 group">
        {/* Layer Selector Pill */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-1 border border-slate-200 shadow-md flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveLayer('google_hybrid')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeLayer === 'google_hybrid'
                ? 'bg-[#0F2854] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('osm')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeLayer === 'osm'
                ? 'bg-[#0F2854] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Street Map
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('google_terrain')}
            className={`hidden sm:inline-block px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeLayer === 'google_terrain'
                ? 'bg-[#0F2854] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Floating Recenter-to-My-Location Control Button */}
        <div className="absolute top-3 left-3 z-[1000]">
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 rounded-xl bg-white/95 backdrop-blur-sm text-[#0F2854] hover:bg-slate-100 border border-slate-200 shadow-md flex items-center gap-1.5 text-xs font-semibold transition-colors"
            title="Recenter Map View to Pinpoint"
          >
            <Crosshair className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline text-[11px]">Recenter</span>
          </button>
        </div>

        {/* Hint banner at bottom */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-[10px] pointer-events-none flex items-center gap-1.5 shadow">
          <MapPin className="w-3 h-3 text-orange-400" />
          <span>Drag marker or click anywhere on the map to adjust exact spot</span>
        </div>

        {/* Map Container — Stable without re-mounting on coordinate changes! */}
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution={MAP_LAYERS[activeLayer].attribution}
            url={MAP_LAYERS[activeLayer].url}
            maxZoom={MAP_LAYERS[activeLayer].maxZoom}
          />

          {/* Accuracy Circle */}
          {accuracy > 0 && (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{
                color: accuracy > 100 ? '#F59E0B' : '#0F2854',
                fillColor: accuracy > 100 ? '#F59E0B' : '#3B82F6',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: accuracy > 100 ? '4, 4' : undefined,
              }}
            />
          )}

          {/* Draggable Grievance Marker */}
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
            icon={customPinIcon}
          />

          {/* Pan Controller & Event Listeners */}
          <MapPanController position={position} recenterTrigger={recenterCount} />
          <MapEventsController onSelect={handleMapClick} />
        </MapContainer>
      </div>

      {/* Coordinate & Accuracy Bar + External Maps Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-3 font-mono">
          <span>Lat: {position[0].toFixed(5)}</span>
          <span>Lng: {position[1].toFixed(5)}</span>
          <span className="text-[10px] text-slate-400 font-sans">
            (Accuracy: ±{Math.round(accuracy)}m)
          </span>
          <button
            type="button"
            onClick={handleCopyCoordinates}
            className="text-slate-500 hover:text-slate-800 ml-1 inline-flex items-center gap-1 font-sans text-[10px]"
            title="Copy coordinates"
          >
            {copiedCoords ? (
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <Copy className="w-3 h-3" /> Copy
              </span>
            )}
          </button>
        </div>

        {/* External Inspection Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs text-[11px] font-medium"
            title="Open in Google Maps"
          >
            <Compass className="w-3 h-3 text-blue-600" />
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>

          <a
            href={googleStreetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs text-[11px] font-medium"
            title="Inspect ground reality via Google Street View 360°"
          >
            <Eye className="w-3 h-3 text-amber-600" />
            <span>Street View 360°</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>

          <a
            href={googleDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs text-[11px] font-medium"
            title="Get driving directions to this location"
          >
            <Route className="w-3 h-3 text-orange-600" />
            <span>Directions</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
