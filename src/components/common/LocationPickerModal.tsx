import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { MapPin, Navigation, Check, Compass, AlertCircle, Loader2, Search, Building2, Globe } from 'lucide-react';
import {
  useLocation,
  SUPPORTED_CITIES,
  PRESET_LOCAL_AREAS,
  LocalArea
} from '../../contexts/LocationContext.js';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose }) => {
  const {
    currentLocation,
    selectedRadius,
    isLocating,
    locationError,
    detectLocation,
    setCity,
    setArea,
    setRadius,
  } = useLocation();

  const [activeCityTab, setActiveCityTab] = useState<string>(currentLocation.city || 'Delhi NCR');
  const [radiusInput, setRadiusInput] = useState<number | null>(selectedRadius);
  const [filterSearch, setFilterSearch] = useState('');

  const radiusOptions = [
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '15 km', value: 15 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: 'Entire City', value: null },
  ];

  const handleUseGps = async () => {
    await detectLocation();
  };

  const handleSelectCity = (cityName: string) => {
    setActiveCityTab(cityName);
    setCity(cityName);
  };

  const handleSelectArea = (area: LocalArea) => {
    setArea(area);
    setActiveCityTab(area.city);
    onClose();
  };

  const handleApply = () => {
    setRadius(radiusInput);
    onClose();
  };

  // Filter preset areas based on city tab and search term
  const filteredAreas = PRESET_LOCAL_AREAS.filter((a) => {
    const matchesSearch =
      filterSearch === '' ||
      a.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (a.pincode && a.pincode.includes(filterSearch));

    if (filterSearch) {
      return matchesSearch;
    }

    if (activeCityTab === 'All') return true;
    return a.city.toLowerCase() === activeCityTab.toLowerCase();
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Healthcare Location"
      subtitle="Discover verified specialist doctors, pathology labs & clinics near your current locality"
      maxWidth="xl"
    >
      <div className="space-y-4 sm:space-y-5 text-slate-800">
        {/* Device GPS 1-Click Action */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 rounded-2xl border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
              <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Active Location:</span>
                <span className="text-teal-700 font-extrabold truncate">
                  {currentLocation.areaName}, {currentLocation.city}
                </span>
              </p>
              <p className="text-[11px] text-slate-600 font-medium truncate">
                {currentLocation.isLiveGps
                  ? 'Real-Time GPS Coordinates Active'
                  : 'Selected Regional Healthcare Hub'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            disabled={isLocating}
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-teal-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLocating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Detecting Location...</span>
              </>
            ) : (
              <>
                <Compass size={14} />
                <span>Use Current Device GPS</span>
              </>
            )}
          </button>
        </div>

        {locationError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {/* City Selection Switcher */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Select City / Healthcare Region
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCityTab('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCityTab === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Regions
            </button>
            {SUPPORTED_CITIES.map((city) => {
              const isSelected = activeCityTab.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proximity Radius */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Search Proximity Radius (km)
            </label>
            <span className="text-[11px] font-semibold text-slate-500">
              {radiusInput ? `Within ${radiusInput} km` : 'Entire metropolitan area'}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {radiusOptions.map((opt) => {
              const isSelected = radiusInput === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setRadiusInput(opt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Localities */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search locality name, landmark, or PIN code (e.g. Connaught Place, Bandra, Indiranagar, Gomti Nagar, 110001)..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors font-medium"
          />
        </div>

        {/* Local Area Quick Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Healthcare Hubs ({filteredAreas.length} Available)
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Click to select locality</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {filteredAreas.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No preset areas match &quot;{filterSearch}&quot;. You can use device GPS or pick another city.
              </div>
            ) : (
              filteredAreas.map((area) => {
                const isCurrent =
                  !currentLocation.isLiveGps && currentLocation.areaName === area.name;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleSelectArea(area)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin
                          size={14}
                          className={isCurrent ? 'text-teal-600 shrink-0' : 'text-slate-400 shrink-0'}
                        />
                        <span className="text-xs font-bold text-slate-900">{area.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                          {area.city}
                        </span>
                        {area.pincode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            PIN: {area.pincode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{area.description}</p>
                    </div>

                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-600 text-white rounded-full flex items-center gap-1 shrink-0">
                        <Check size={11} /> Selected
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-teal-500/20 cursor-pointer"
          >
            Apply Location Settings
          </button>
        </div>
      </div>
    </Modal>
  );
};
