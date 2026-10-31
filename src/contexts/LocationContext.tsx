import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface SupportedCity {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  isPopular?: boolean;
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

export const SUPPORTED_CITIES: SupportedCity[] = [
  { id: 'delhi-ncr', name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lng: 77.2090, isPopular: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, isPopular: true },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, isPopular: true },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, isPopular: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, isPopular: true },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, isPopular: true },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, isPopular: false },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, isPopular: false },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, isPopular: false },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, isPopular: false },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794, isPopular: false },
];

export const PRESET_LOCAL_AREAS: LocalArea[] = [
  // Delhi NCR
  {
    id: 'del-connaught-place',
    name: 'Connaught Place & Central Delhi',
    city: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.6315,
    lng: 77.2167,
    description: 'Central Commercial & Medical Chambers, Multispecialty OPD Clinics',
    pincode: '110001',
  },
  {
    id: 'del-saket',
    name: 'Saket & South Delhi District',
    city: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.5273,
    lng: 77.2150,
    description: 'South Delhi Healthcare Hub, Super-Specialty Heart, Cancer & Neuro Care',
    pincode: '110017',
  },
  {
    id: 'del-cyber-city',
    name: 'Cyber City & DLF Phase 2',
    city: 'Delhi NCR',
    state: 'Haryana',
    lat: 28.4900,
    lng: 77.0890,
    description: 'Corporate Outpatient Enclaves, Executive Preventive Checkups & Diagnostics',
    pincode: '122002',
  },
  {
    id: 'del-noida-sec18',
    name: 'Sector 18 & Central Noida',
    city: 'Delhi NCR',
    state: 'Uttar Pradesh',
    lat: 28.5708,
    lng: 77.3260,
    description: 'Noida Medical Corridor, Polyclinics, Imaging & Diagnostic Reference Centers',
    pincode: '201301',
  },
  {
    id: 'del-dwarka',
    name: 'Dwarka Sector 12 & Sub-City',
    city: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.5921,
    lng: 77.0460,
    description: 'West Delhi Residential Polyclinics, NABL Collection Centers & Family Care',
    pincode: '110075',
  },

  // Mumbai
  {
    id: 'mum-bandra-west',
    name: 'Bandra West & Linking Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
    description: 'Western Suburbs Healthcare Enclave, Specialist Doctors & Advanced Daycare',
    pincode: '400050',
  },
  {
    id: 'mum-andheri-west',
    name: 'Andheri West & Lokhandwala',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.1310,
    lng: 72.8250,
    description: 'Bustling Suburb Polyclinics, Orthopedic, Derma & Diagnostic Care Hub',
    pincode: '400053',
  },
  {
    id: 'mum-lower-parel',
    name: 'Lower Parel & Worli',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 18.9950,
    lng: 72.8280,
    description: 'South Central Mumbai Medical Centers, Cardiac & Metabolic Health Clinics',
    pincode: '400013',
  },
  {
    id: 'mum-powai',
    name: 'Powai & Hiranandani Gardens',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.1176,
    lng: 72.9060,
    description: 'Eastern Suburbs Health District, Pediatric, ENT & Multispecialty OPDs',
    pincode: '400076',
  },

  // Bengaluru
  {
    id: 'blr-indiranagar',
    name: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9784,
    lng: 77.6408,
    description: 'East Bengaluru Health Corridor, Top Consultant Chambers & Digital Pathology',
    pincode: '560038',
  },
  {
    id: 'blr-koramangala',
    name: 'Koramangala 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9352,
    lng: 77.6245,
    description: 'South Bengaluru Medical Hub, Endocrinology, Wellness & Rapid Testing',
    pincode: '560034',
  },
  {
    id: 'blr-whitefield',
    name: 'Whitefield & ITPL Corridor',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9698,
    lng: 77.7500,
    description: 'Tech Corridor Outpatient Clinics, Super-Specialty Medical Complexes',
    pincode: '560066',
  },
  {
    id: 'blr-jayanagar',
    name: 'Jayanagar & JP Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9308,
    lng: 77.5838,
    description: 'Traditional South Bengaluru Healthcare Belt, Senior Specialists & Scans',
    pincode: '560011',
  },

  // Lucknow
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
    id: 'lko-shaheed-path',
    name: 'Sushant Golf City & Shaheed Path',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.7935,
    lng: 81.0112,
    description: 'Apex Quaternary Hospital District & Outpatient Towers',
    pincode: '226030',
  },

  // Hyderabad
  {
    id: 'hyd-jubilee-hills',
    name: 'Jubilee Hills & Road 36',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4225,
    lng: 78.4110,
    description: 'Premium Super-Specialty Medical Chambers, Day Clinics & Diagnostics',
    pincode: '500033',
  },
  {
    id: 'hyd-banjara-hills',
    name: 'Banjara Hills Road 12',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4150,
    lng: 78.4480,
    description: 'Premier Multi-Hospital Belt, Cardiac, Neuro & Metabolic Clinics',
    pincode: '500034',
  },
  {
    id: 'hyd-hitec-city',
    name: 'HITEC City & Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4475,
    lng: 78.3762,
    description: 'IT Corridor Urgent Care, Multispecialty OPDs & Phlebotomy Hubs',
    pincode: '500081',
  },

  // Pune
  {
    id: 'pne-koregaon-park',
    name: 'Koregaon Park & Bund Garden',
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5362,
    lng: 73.8940,
    description: 'Central Pune Specialist Outpatient Chambers & Diagnostic Labs',
    pincode: '411001',
  },
  {
    id: 'pne-baner',
    name: 'Baner & Aundh Corridor',
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5590,
    lng: 73.7868,
    description: 'Western Pune Polyclinic Enclave, Pediatrics, Ortho & Family Clinics',
    pincode: '411045',
  },

  // Kolkata
  {
    id: 'kol-salt-lake',
    name: 'Salt Lake Sector V',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5800,
    lng: 88.4350,
    description: 'Eastern Diagnostics Corridor, Multispecialty OPD & Scans',
    pincode: '700091',
  },
  {
    id: 'kol-park-street',
    name: 'Park Street & Central Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5510,
    lng: 88.3520,
    description: 'Central Medical Chambers, Senior Consultants & Pathology Hub',
    pincode: '700016',
  },

  // Chennai
  {
    id: 'chn-t-nagar',
    name: 'T. Nagar & Mount Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0418,
    lng: 80.2341,
    description: 'Central Chennai Healthcare District, Specialty Polyclinics & Tests',
    pincode: '600017',
  },
  {
    id: 'chn-adyar',
    name: 'Adyar & Besant Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0012,
    lng: 80.2565,
    description: 'South Chennai Medical Enclave, Specialized Outpatient & Diagnostics',
    pincode: '600020',
  },
];

interface LocationState {
  lat: number;
  lng: number;
  areaName: string;
  city: string;
  state: string;
  isLiveGps: boolean;
}

interface LocationContextType {
  currentLocation: LocationState;
  selectedCity: string;
  selectedRadius: number | null; // kilometers (null = entire city)
  isLocating: boolean;
  locationError: string | null;
  detectLocation: () => Promise<void>;
  setCity: (cityName: string) => void;
  setArea: (area: LocalArea) => void;
  setManualLocation: (areaName: string, lat: number, lng: number, city?: string, state?: string) => void;
  setRadius: (radius: number | null) => void;
  calculateDistance: (lat?: number, lng?: number) => number | null;
  formatDistance: (lat?: number, lng?: number) => string | null;
  isWithinRadius: (lat?: number, lng?: number) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to compute great-circle distance in kilometers
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat1 - lat2) * (Math.PI / 180);
  const dLon = (lon1 - lon2) * (Math.PI / 180);
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
  // Default to Delhi NCR central hub, or previously saved location
  const [currentLocation, setCurrentLocation] = useState<LocationState>({
    lat: PRESET_LOCAL_AREAS[0].lat,
    lng: PRESET_LOCAL_AREAS[0].lng,
    areaName: PRESET_LOCAL_AREAS[0].name,
    city: PRESET_LOCAL_AREAS[0].city,
    state: PRESET_LOCAL_AREAS[0].state,
    isLiveGps: false,
  });

  const [selectedRadius, setSelectedRadius] = useState<number | null>(15); // Default: within 15 km
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('medilink_india_location_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng && parsed.areaName && parsed.city) {
          setCurrentLocation(parsed);
        }
      }
      const savedRadius = localStorage.getItem('medilink_india_radius_v2');
      if (savedRadius !== null) {
        setSelectedRadius(savedRadius === 'all' ? null : Number(savedRadius));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveLocationState = (loc: LocationState) => {
    setCurrentLocation(loc);
    try {
      localStorage.setItem('medilink_india_location_v2', JSON.stringify(loc));
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
          setLocationError('GPS detection timed out. Using current selected area.');
          resolve();
        }
      }, 7000);

      try {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timer);

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Find closest preset area and city
            let closestArea = PRESET_LOCAL_AREAS[0];
            let minAreaDist = Infinity;
            for (const area of PRESET_LOCAL_AREAS) {
              const d = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
              if (d < minAreaDist) {
                minAreaDist = d;
                closestArea = area;
              }
            }

            let closestCity = SUPPORTED_CITIES[0];
            let minCityDist = Infinity;
            for (const city of SUPPORTED_CITIES) {
              const d = getDistanceFromLatLonInKm(lat, lng, city.lat, city.lng);
              if (d < minCityDist) {
                minCityDist = d;
                closestCity = city;
              }
            }

            let resolvedAreaName = minAreaDist <= 12
              ? closestArea.name
              : `Current Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;
            let resolvedCity = closestCity.name;
            let resolvedState = closestCity.state;

            // Attempt reverse geocoding via OpenStreetMap Nominatim with timeout
            try {
              const controller = new AbortController();
              const fetchTimer = setTimeout(() => controller.abort(), 3500);
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                {
                  headers: { 'Accept': 'application/json' },
                  signal: controller.signal,
                }
              );
              clearTimeout(fetchTimer);

              if (response.ok) {
                const data = await response.json();
                if (data && data.address) {
                  const addr = data.address;
                  const geoCity =
                    addr.city ||
                    addr.town ||
                    addr.municipality ||
                    addr.village ||
                    addr.state_district ||
                    closestCity.name;
                  const geoArea =
                    addr.suburb ||
                    addr.neighbourhood ||
                    addr.residential ||
                    addr.quarter ||
                    addr.road ||
                    geoCity;
                  const geoState = addr.state || closestCity.state;

                  resolvedCity = geoCity;
                  resolvedAreaName = geoArea;
                  resolvedState = geoState;
                }
              }
            } catch {
              // Graceful fallback to nearest preset hub
            }

            const updated: LocationState = {
              lat,
              lng,
              areaName: resolvedAreaName,
              city: resolvedCity,
              state: resolvedState,
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
            let message = 'Unable to access device GPS.';
            if (err.code === err.PERMISSION_DENIED) {
              message = 'GPS permission was denied. You can select any city or locality below.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              message = 'Position unavailable. Showing selected regional medical hub.';
            }
            setLocationError(message);
            resolve();
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          setIsLocating(false);
          setLocationError('GPS is not accessible in this browser frame.');
          resolve();
        }
      }
    });
  };

  const setCity = (cityName: string) => {
    // Find preset area in this city or city coordinates
    const cityArea = PRESET_LOCAL_AREAS.find(
      (a) => a.city.toLowerCase() === cityName.toLowerCase()
    );
    const supported = SUPPORTED_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );

    const lat = cityArea ? cityArea.lat : (supported ? supported.lat : currentLocation.lat);
    const lng = cityArea ? cityArea.lng : (supported ? supported.lng : currentLocation.lng);
    const areaName = cityArea ? cityArea.name : cityName;
    const state = cityArea ? cityArea.state : (supported ? supported.state : currentLocation.state);

    const updated: LocationState = {
      lat,
      lng,
      areaName,
      city: cityName,
      state,
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setArea = (area: LocalArea) => {
    const updated: LocationState = {
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

  const setManualLocation = (
    areaName: string,
    lat: number,
    lng: number,
    city = 'Delhi NCR',
    state = 'India'
  ) => {
    const updated: LocationState = {
      lat,
      lng,
      areaName,
      city,
      state,
      isLiveGps: false,
    };
    saveLocationState(updated);
    setLocationError(null);
  };

  const setRadius = (radius: number | null) => {
    setSelectedRadius(radius);
    try {
      localStorage.setItem('medilink_india_radius_v2', radius === null ? 'all' : String(radius));
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
    if (dist < 0.25) return 'Within 250m';
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
        selectedCity: currentLocation.city,
        selectedRadius,
        isLocating,
        locationError,
        detectLocation,
        setCity,
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
