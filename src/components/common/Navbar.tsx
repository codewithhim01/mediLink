import React, { useState } from 'react';
import {
  Activity,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  CheckCheck,
  ShieldCheck,
  Stethoscope,
  Building2,
  TestTube2,
  Sparkles,
  MapPin,
  Navigation,
  Check,
  Compass,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNotifications } from '../../contexts/NotificationContext.js';
import { useLocation, PRESET_LOCAL_AREAS, LocalArea } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from './LocationPickerModal.js';
import { Role } from '../../types/index.js';
import { handleImageError } from '../../utils/imageUtils.js';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const {
    currentLocation,
    selectedRadius,
    isLocating,
    detectLocation,
    setArea,
    setRadius
  } = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = (role: Role) => {
    switch (role) {
      case 'PATIENT': return '/patient/dashboard';
      case 'DOCTOR': return '/doctor/dashboard';
      case 'CLINIC': return '/clinic/dashboard';
      case 'LABORATORY': return '/laboratory/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };

  const roleColors: Record<Role, string> = {
    PATIENT: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
    DOCTOR: 'bg-blue-950/70 text-blue-300 border-blue-800/80',
    CLINIC: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
    LABORATORY: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    ADMIN: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
  };

  const radiusList = [
    { label: '2 km', value: 2 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: 'All', value: null },
  ];

  const handleUseGps = async () => {
    setShowLocationDropdown(false);
    await detectLocation();
  };

  const handleSelectArea = (area: LocalArea) => {
    setArea(area);
    setShowLocationDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/98 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-1.5 sm:gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0 min-w-0">
            <button
              onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group text-left shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Activity size={18} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-lg xl:text-xl font-black bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent">
                  MediLink
                </span>
                <span className="hidden 2xl:block text-[9px] uppercase tracking-wider font-semibold text-teal-400 -mt-1 truncate">
                  Lucknow Health Hub
                </span>
              </div>
            </button>

            {/* Public Navigation - Desktop (xl+) */}
            <nav className="hidden xl:flex items-center gap-1 xl:gap-2">
              <button
                onClick={() => navigate('/doctors')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  currentPath.startsWith('/doctors')
                    ? 'text-teal-300 bg-slate-800 font-semibold border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Find Doctors
              </button>
              <button
                onClick={() => navigate('/diagnostic-tests')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  currentPath.startsWith('/diagnostic-tests')
                    ? 'text-teal-300 bg-slate-800 font-semibold border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Compare Tests
              </button>
              <button
                onClick={() => navigate('/laboratories')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  currentPath.startsWith('/laboratories')
                    ? 'text-teal-300 bg-slate-800 font-semibold border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Laboratories
              </button>
              <button
                onClick={() => navigate('/clinics')}
                className={`px-2.5 xl:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  currentPath.startsWith('/clinics')
                    ? 'text-teal-300 bg-slate-800 font-semibold border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Clinics
              </button>
            </nav>
          </div>

          {/* Right Section: Combined Live GPS & Location Selector + Notification + Profile / Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
            {/* COMBINED Live GPS & Location Selection Pill */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer shadow-xs ${
                  currentLocation.isLiveGps
                    ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-400/30'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border-slate-700 hover:border-teal-500/50'
                }`}
                title="Change location in Lucknow or use live GPS"
              >
                {/* GPS / Pin Icon with Radar pulse when live */}
                <div className="relative flex items-center justify-center shrink-0">
                  {currentLocation.isLiveGps ? (
                    <>
                      <Navigation size={12} className={`text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                      </span>
                    </>
                  ) : (
                    <MapPin size={12} className="text-teal-400 shrink-0" />
                  )}
                </div>

                <span className="max-w-[55px] xs:max-w-[75px] sm:max-w-[100px] md:max-w-[130px] xl:max-w-[160px] truncate text-[11px] sm:text-xs font-semibold">
                  {currentLocation.areaName}
                </span>

                <span className="hidden md:inline-block text-[10px] text-teal-300 font-bold bg-teal-950/90 border border-teal-800/70 px-1.5 py-0.2 rounded-full shrink-0">
                  {selectedRadius ? `${selectedRadius} km` : 'All'}
                </span>

                <ChevronDown size={11} className="text-slate-400 shrink-0" />
              </button>

              {/* Combined Fast Location & GPS Popover Dropdown */}
              {showLocationDropdown && (
                <div className="absolute right-0 mt-2 w-[min(calc(100vw-1.5rem),340px)] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 text-slate-100 divide-y divide-slate-800 animate-in fade-in">
                  {/* Current Active Location Card with Status */}
                  <div className="pb-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Area</span>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <MapPin size={14} className="text-teal-400 shrink-0" />
                        <span className="truncate">{currentLocation.areaName}, Lucknow</span>
                      </p>
                    </div>
                    {currentLocation.isLiveGps ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full flex items-center gap-1 shrink-0">
                        <Check size={10} /> Live GPS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-full shrink-0">
                        Manual Area
                      </span>
                    )}
                  </div>

                  {/* 1-Click Action: Use Live GPS Location */}
                  <div className="py-2.5">
                    <button
                      type="button"
                      onClick={handleUseGps}
                      disabled={isLocating}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                        currentLocation.isLiveGps
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      }`}
                    >
                      <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
                      <span>
                        {isLocating
                          ? 'Detecting GPS...'
                          : currentLocation.isLiveGps
                          ? 'Refresh Live GPS Location'
                          : 'Use Current Device GPS Location'}
                      </span>
                    </button>
                  </div>

                  {/* Radius Quick Selector */}
                  <div className="py-2.5">
                    <span className="block text-[11px] text-slate-400 font-medium mb-1.5">
                      Proximity Radius (km)
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-center">
                      {radiusList.map((r) => {
                        const isSelected = selectedRadius === r.value;
                        return (
                          <button
                            key={r.label}
                            type="button"
                            onClick={() => setRadius(r.value)}
                            className={`py-1 rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lucknow Localities Fast Selector */}
                  <div className="py-2.5">
                    <span className="block text-[11px] text-slate-400 font-medium mb-1.5">
                      Select Major Lucknow Healthcare Hub
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/60 text-xs">
                      {PRESET_LOCAL_AREAS.slice(0, 8).map((area) => {
                        const isCurrent =
                          !currentLocation.isLiveGps && currentLocation.areaName === area.name;
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => handleSelectArea(area)}
                            className={`w-full text-left py-1.5 px-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-800 text-teal-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{area.name}</span>
                            {isCurrent && <Check size={13} className="text-teal-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Open Comprehensive Modal */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLocationDropdown(false);
                        setShowLocationModal(true);
                      }}
                      className="w-full py-1.5 text-center text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>All Localities & PIN Codes</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-88 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 py-3 z-50 text-slate-100">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                            className={`p-3 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                              !n.isRead ? 'bg-slate-800/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold ${!n.isRead ? 'text-teal-300' : 'text-slate-300'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User / Desktop Login Button */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    onError={(e) => handleImageError(e, user.name)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-700 object-cover shrink-0"
                  />
                  <div className="hidden 2xl:block text-left text-xs">
                    <p className="font-semibold text-slate-100 line-clamp-1">{user.name}</p>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 hidden sm:block shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-xl border border-slate-700/80 py-2 z-50 text-slate-100">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { navigate(getDashboardPath(user.role)); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-teal-400 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Activity size={14} /> Go to {user.role} Dashboard
                    </button>

                    {user.role === 'PATIENT' && (
                      <button
                        onClick={() => { navigate('/patient/reports'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={14} className="text-teal-400" /> AI Report Assistant
                      </button>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:inline-flex px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-sm shadow-teal-500/20 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Join
                </button>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle (xl:hidden) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer (xl:hidden) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-5 space-y-3 animate-in fade-in duration-150">
          <nav className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => { navigate('/doctors'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-semibold text-left transition-colors cursor-pointer ${
                currentPath.startsWith('/doctors')
                  ? 'bg-teal-950 text-teal-300 border border-teal-800/80'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              🩺 Find Doctors
            </button>
            <button
              onClick={() => { navigate('/diagnostic-tests'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-semibold text-left transition-colors cursor-pointer ${
                currentPath.startsWith('/diagnostic-tests')
                  ? 'bg-teal-950 text-teal-300 border border-teal-800/80'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              🧪 Compare Tests
            </button>
            <button
              onClick={() => { navigate('/laboratories'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-semibold text-left transition-colors cursor-pointer ${
                currentPath.startsWith('/laboratories')
                  ? 'bg-teal-950 text-teal-300 border border-teal-800/80'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              🔬 Laboratories
            </button>
            <button
              onClick={() => { navigate('/clinics'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-xl font-semibold text-left transition-colors cursor-pointer ${
                currentPath.startsWith('/clinics')
                  ? 'bg-teal-950 text-teal-300 border border-teal-800/80'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              🏥 Clinics
            </button>
          </nav>

          {/* Mobile Auth Actions */}
          {!isAuthenticated || !user ? (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center text-xs font-semibold text-slate-300 bg-slate-800 rounded-xl cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-xs cursor-pointer"
              >
                Join MediLink
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <button
                onClick={() => { navigate(getDashboardPath(user.role)); setMobileMenuOpen(false); }}
                className="w-full py-2 px-3 bg-teal-950/80 border border-teal-800/80 text-teal-300 rounded-xl text-xs font-bold text-left flex items-center gap-2 cursor-pointer"
              >
                <Activity size={14} /> Go to {user.role} Dashboard
              </button>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                className="w-full py-2 px-3 bg-slate-800 text-rose-400 rounded-xl text-xs font-semibold text-left flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={14} /> Log Out ({user.name})
              </button>
            </div>
          )}
        </div>
      )}

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </header>
  );
};
