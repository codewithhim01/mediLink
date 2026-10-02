import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { MapPin, Navigation, Check, Compass, AlertCircle, Loader2 } from 'lucide-react';
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
    { label: '5 miles', value: 5 },
    { label: '10 miles', value: 10 },
    { label: '15 miles', value: 15 },
    { label: '25 miles', value: 25 },
    { label: '50 miles', value: 50 },
    { label: 'Any Distance', value: null },
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
      a.city.toLowerCase().includes(filterSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Local Healthcare Area & Proximity"
      subtitle="Find doctors, diagnostic laboratories, and clinics near your home or workplace"
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
                  ? `Live GPS Active (${currentLocation.areaName})`
                  : `Selected Area: ${currentLocation.areaName}`}
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
                <span>Locating GPS...</span>
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
            Search Radius for Local Providers
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

        {/* Local Area Quick Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">
              Select Neighborhood or Health District
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Oregon Metro Network</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
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
                      <p className="text-xs font-bold text-slate-900">{area.name}</p>
                      <p className="text-[11px] text-slate-500">{area.description}</p>
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
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Coordinates: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              Apply Area
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
