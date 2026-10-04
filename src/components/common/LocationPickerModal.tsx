import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { MapPin, Navigation, Check, Compass, AlertCircle, Loader2, Search } from 'lucide-react';
import { useLocation, PRESET_LOCAL_AREAS, LocalArea } from '../../contexts/LocationContext.js';

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
    setArea,
    setRadius,
  } = useLocation();

  const [radiusInput, setRadiusInput] = useState<number | null>(selectedRadius);
  const [filterSearch, setFilterSearch] = useState('');

  const radiusOptions = [
    { label: '2 km', value: 2 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '15 km', value: 15 },
    { label: '25 km', value: 25 },
    { label: 'All Lucknow', value: null },
  ];

  const handleUseGps = async () => {
    await detectLocation();
  };

  const handleSelectArea = (area: LocalArea) => {
    setArea(area);
  };

  const handleApply = () => {
    setRadius(radiusInput);
    onClose();
  };

  const filteredAreas = PRESET_LOCAL_AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (a.pincode && a.pincode.includes(filterSearch))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Your Locality in Lucknow"
      subtitle="Find OPD specialists, diagnostic labs, and clinics near your home or office in Lucknow"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* GPS Button */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Current Position</p>
              <p className="text-[11px] text-slate-600 font-medium">
                {currentLocation.isLiveGps
                  ? `Live GPS Active (${currentLocation.areaName}, Lucknow)`
                  : `Selected Locality: ${currentLocation.areaName}, Lucknow`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            disabled={isLocating}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLocating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Detecting GPS...</span>
              </>
            ) : (
              <>
                <Compass size={14} />
                <span>Use Current GPS Location</span>
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

        {/* Distance Radius Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Search Proximity Radius (km)
          </label>
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

        {/* Search localities */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search Lucknow area or pincode (e.g. Gomti Nagar, 226010, Hazratganj)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Local Area Quick Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Select Major Healthcare Hubs in Lucknow
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Lucknow Metro Network</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {filteredAreas.map((area) => {
              const isCurrent =
                !currentLocation.isLiveGps && currentLocation.areaName === area.name;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSelectArea(area)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/70 border border-blue-200 text-blue-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin
                      size={16}
                      className={isCurrent ? 'text-blue-600 mt-0.5' : 'text-slate-400 mt-0.5'}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{area.name}</p>
                        {area.pincode && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                            PIN {area.pincode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{area.description}</p>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shrink-0">
                      <Check size={11} /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Coordinates: {currentLocation.lat.toFixed(4)}°N, {currentLocation.lng.toFixed(4)}°E (Lucknow, UP)
          </p>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 cursor-pointer text-center"
            >
              Apply Locality
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
