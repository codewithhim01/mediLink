import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocalArea {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  description: string;
}

export const PRESET_LOCAL_AREAS: LocalArea[] = [
  {
    id: 'pdx-downtown',
    name: 'Downtown / Pearl District',
    city: 'Portland, OR',
    lat: 45.5231,
    lng: -122.6765,
    description: 'Central Portland, Metro Specialists, Pearl District clinics',
  },
  {
    id: 'pdx-eastside',
    name: 'Eastside Medical Tech Park',
    city: 'Portland, OR',
    lat: 45.5152,
    lng: -122.6587,
    description: 'Inner Eastside, Pathology labs, Specialty surgical centers',
  },
  {
    id: 'beaverton-hub',
    name: 'Beaverton Tech Corridor',
    city: 'Beaverton, OR',
    lat: 45.4871,
    lng: -122.8037,
    description: 'Westside outpatient centers, Apex labs, Cedar Hills clinics',
  },
  {
    id: 'lake-oswego',
    name: 'Lake Oswego / South Metro',
    city: 'Lake Oswego, OR',
    lat: 45.4207,
    lng: -122.6706,
    description: 'South Metro specialty pavilions, preventive health centers',
  },
  {
    id: 'hillsboro',
    name: 'Hillsboro / Silicon Forest',
    city: 'Hillsboro, OR',
    lat: 45.5229,
    lng: -122.9898,
    description: 'Sunset Medical corridor, urgent care centers, regional labs',
  },
  {
    id: 'tigard',
    name: 'Tigard / Washington Square',
    city: 'Tigard, OR',
    lat: 45.4312,
    lng: -122.7712,
    description: 'Southwest suburban health centers, diagnostics & imaging',
  },
  {
    id: 'springfield',
    name: 'Springfield / Eugene Metro',
    city: 'Springfield, OR',
    lat: 44.0462,
    lng: -123.0220,
    description: 'Willamette Valley medical centers, regional pathology hubs',
  },
];

interface LocationContextType {
  currentLocation: {
    lat: number;
    lng: number;
    areaName: string;
    isLiveGps: boolean;
  };
  selectedRadius: number | null; // miles (null = all)
  isLocating: boolean;
  locationError: string | null;
  detectLocation: () => Promise<void>;
  setArea: (area: LocalArea) => void;
  setManualLocation: (areaName: string, lat: number, lng: number) => void;
  setRadius: (radius: number | null) => void;
  calculateDistance: (lat?: number, lng?: number) => number | null;
  formatDistance: (lat?: number, lng?: number) => string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to compute great-circle distance between two points in statute miles
export function getDistanceFromLatLonInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in statute miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Downtown / Pearl District as initial local center
  const [currentLocation, setCurrentLocation] = useState({
    lat: PRESET_LOCAL_AREAS[0].lat,
    lng: PRESET_LOCAL_AREAS[0].lng,
    areaName: PRESET_LOCAL_AREAS[0].name,
    isLiveGps: false,
  });

  const [selectedRadius, setSelectedRadius] = useState<number | null>(15); // Default: within 15 miles
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Restore stored user location preference if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('medilink_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng && parsed.areaName) {
          setCurrentLocation(parsed);
        }
      }
      const savedRadius = localStorage.getItem('medilink_user_radius');
      if (savedRadius !== null) {
        setSelectedRadius(savedRadius === 'all' ? null : Number(savedRadius));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveLocationState = (loc: typeof currentLocation) => {
    setCurrentLocation(loc);
    try {
      localStorage.setItem('medilink_user_location', JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const detectLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Find closest known local area name for friendly display
          let closestArea = PRESET_LOCAL_AREAS[0];
          let minDistance = Infinity;

          for (const area of PRESET_LOCAL_AREAS) {
            const dist = getDistanceFromLatLonInMiles(lat, lng, area.lat, area.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestArea = area;
            }
          }

          const friendlyName =
            minDistance <= 12
              ? `Nearby ${closestArea.name}`
              : `Current Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

          const updated = {
            lat,
            lng,
            areaName: friendlyName,
            isLiveGps: true,
          };

          saveLocationState(updated);
          setIsLocating(false);
          resolve();
        },
        (err) => {
          setIsLocating(false);
          let message = 'Unable to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location access was denied. Please select a local neighborhood manually.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Position unavailable. Defaulting to local medical center.';
          } else if (err.code === err.TIMEOUT) {
            message = 'Location request timed out.';
          }
          setLocationError(message);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const setArea = (area: LocalArea) => {
    const updated = {
      lat: area.lat,
      lng: area.lng,
      areaName: area.name,
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setManualLocation = (areaName: string, lat: number, lng: number) => {
    const updated = {
      lat,
      lng,
      areaName,
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setRadius = (radius: number | null) => {
    setSelectedRadius(radius);
    try {
      localStorage.setItem('medilink_user_radius', radius === null ? 'all' : String(radius));
    } catch {
      // ignore
    }
  };

  const calculateDistance = (lat?: number, lng?: number): number | null => {
    if (lat === undefined || lng === undefined) return null;
    const dist = getDistanceFromLatLonInMiles(currentLocation.lat, currentLocation.lng, lat, lng);
    return Math.round(dist * 10) / 10;
  };

  const formatDistance = (lat?: number, lng?: number): string | null => {
    const dist = calculateDistance(lat, lng);
    if (dist === null) return null;
    if (dist < 0.1) return 'Within 0.1 miles';
    return `${dist.toFixed(1)} mi away`;
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        selectedRadius,
        isLocating,
        locationError,
        detectLocation,
        setArea,
        setManualLocation,
        setRadius,
        calculateDistance,
        formatDistance,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
