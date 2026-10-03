import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocalArea {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  description: string;
  pincode?: string;
}

export const PRESET_LOCAL_AREAS: LocalArea[] = [
  {
    id: 'lko-gomti-nagar',
    name: 'Gomti Nagar & Vibhuti Khand',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8500,
    lng: 80.9990,
    description: 'Vibhuti Khand Healthcare Corridor, Super-Specialty Clinics & Labs',
    pincode: '226010',
  },
  {
    id: 'lko-hazratganj',
    name: 'Hazratganj & Central Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    description: 'City Centre, Senior Consultant Chambers, Heart & Neuro Care',
    pincode: '226001',
  },
  {
    id: 'lko-aliganj',
    name: 'Aliganj & Kapoorthala',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8920,
    lng: 80.9385,
    description: 'North Lucknow Polyclinics, Pathology & Imaging Hub',
    pincode: '226024',
  },
  {
    id: 'lko-indira-nagar',
    name: 'Indira Nagar & Ring Road',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8790,
    lng: 80.9850,
    description: 'Residential & Multi-Specialty Clinics, Diabetic Care',
    pincode: '226016',
  },
  {
    id: 'lko-mahanagar',
    name: 'Mahanagar',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8710,
    lng: 80.9520,
    description: 'Maternity, Pediatrics & ENT Specialist Centres',
    pincode: '226006',
  },
  {
    id: 'lko-chowk',
    name: 'Chowk & Medical College Area',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8680,
    lng: 80.9120,
    description: 'Near KGMU Medical Corridor, Tertiary Diagnostics & OPD',
    pincode: '226003',
  },
  {
    id: 'lko-alambagh',
    name: 'Alambagh & Kanpur Road',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8080,
    lng: 80.9020,
    description: 'South Lucknow Medical Transit Hub, Ortho & Family Clinics',
    pincode: '226005',
  },
  {
    id: 'lko-ashiyana',
    name: 'Ashiyana & LDA Colony',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.7920,
    lng: 80.9180,
    description: 'South Lucknow Health Enclave, NABL Sample Collection Hubs',
    pincode: '226012',
  },
  {
    id: 'lko-raebareli-rd',
    name: 'Raebareli Road & SGPGI District',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.7650,
    lng: 80.9410,
    description: 'Apex Research Institutions, Super-Specialty Endocrinology & Cardiac',
    pincode: '226014',
  },
  {
    id: 'lko-jankipuram',
    name: 'Jankipuram & Sitapur Road',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.9200,
    lng: 80.9400,
    description: 'Northern Extension, Urgent Care & Community Diagnostic Hubs',
    pincode: '226021',
  },
];

interface LocationContextType {
  currentLocation: {
    lat: number;
    lng: number;
    areaName: string;
    city: string;
    state: string;
    isLiveGps: boolean;
  };
  selectedRadius: number | null; // kilometers (null = entire city)
  isLocating: boolean;
  locationError: string | null;
  detectLocation: () => Promise<void>;
  setArea: (area: LocalArea) => void;
  setManualLocation: (areaName: string, lat: number, lng: number, city?: string) => void;
  setRadius: (radius: number | null) => void;
  calculateDistance: (lat?: number, lng?: number) => number | null;
  formatDistance: (lat?: number, lng?: number) => string | null;
  isWithinRadius: (lat?: number, lng?: number) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to compute great-circle distance in kilometers (India metric)
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
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
  // Default to Gomti Nagar, Lucknow, India
  const [currentLocation, setCurrentLocation] = useState({
    lat: PRESET_LOCAL_AREAS[0].lat,
    lng: PRESET_LOCAL_AREAS[0].lng,
    areaName: PRESET_LOCAL_AREAS[0].name,
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    isLiveGps: false,
  });

  const [selectedRadius, setSelectedRadius] = useState<number | null>(10); // Default: within 10 km
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('medilink_india_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng && parsed.areaName) {
          setCurrentLocation(parsed);
        }
      }
      const savedRadius = localStorage.getItem('medilink_india_radius');
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
      localStorage.setItem('medilink_india_location', JSON.stringify(loc));
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
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          setIsLocating(false);
          setLocationError('Location detection timed out. Using default Lucknow area.');
          resolve();
        }
      }, 6000);

      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timer);

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Find closest known Lucknow locality
            let closestArea = PRESET_LOCAL_AREAS[0];
            let minDistance = Infinity;

            for (const area of PRESET_LOCAL_AREAS) {
              const dist = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
              if (dist < minDistance) {
                minDistance = dist;
                closestArea = area;
              }
            }

            // If within 30km of Lucknow center, match to closest locality
            const friendlyName =
              minDistance <= 25
                ? `${closestArea.name}`
                : `Current GPS (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;

            const updated = {
              lat,
              lng,
              areaName: friendlyName,
              city: 'Lucknow',
              state: 'Uttar Pradesh',
              isLiveGps: true,
            };

            saveLocationState(updated);
            setIsLocating(false);
            resolve();
          },
          (err) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timer);
            setIsLocating(false);
            let message = 'Unable to access GPS location.';
            if (err.code === err.PERMISSION_DENIED) {
              message = 'GPS permission denied. Showing Gomti Nagar, Lucknow.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              message = 'Position unavailable. Showing default Lucknow area.';
            }
            setLocationError(message);
            resolve();
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          setIsLocating(false);
          setLocationError('GPS is not accessible in this frame.');
          resolve();
        }
      }
    });
  };

  const setArea = (area: LocalArea) => {
    const updated = {
      lat: area.lat,
      lng: area.lng,
      areaName: area.name,
      city: area.city,
      state: area.state,
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setManualLocation = (areaName: string, lat: number, lng: number, city = 'Lucknow') => {
    const updated = {
      lat,
      lng,
      areaName,
      city,
      state: 'Uttar Pradesh',
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setRadius = (radius: number | null) => {
    setSelectedRadius(radius);
    try {
      localStorage.setItem('medilink_india_radius', radius === null ? 'all' : String(radius));
    } catch {
      // ignore
    }
  };

  const calculateDistance = (lat?: number, lng?: number): number | null => {
    if (lat === undefined || lng === undefined) return null;
    const dist = getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, lat, lng);
    return Math.round(dist * 10) / 10;
  };

  const formatDistance = (lat?: number, lng?: number): string | null => {
    const dist = calculateDistance(lat, lng);
    if (dist === null) return null;
    if (dist < 0.2) return 'Within 200m';
    return `${dist.toFixed(1)} km away`;
  };

  const isWithinRadius = (lat?: number, lng?: number): boolean => {
    if (selectedRadius === null) return true;
    if (lat === undefined || lng === undefined) return true;
    const dist = calculateDistance(lat, lng);
    if (dist === null) return true;
    return dist <= selectedRadius;
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
        isWithinRadius,
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
