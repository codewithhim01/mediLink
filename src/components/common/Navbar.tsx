import React, { useState } from 'react';
import { Activity, Bell, ChevronDown, User as UserIcon, LogOut, CheckCheck, ShieldCheck, Stethoscope, Building2, TestTube2, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useNotifications } from '../../contexts/NotificationContext.js';
import { useLocation } from '../../contexts/LocationContext.js';
import { LocationPickerModal } from './LocationPickerModal.js';
import { Role } from '../../types/index.js';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { currentLocation, selectedRadius } = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

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
    PATIENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DOCTOR: 'bg-blue-100 text-blue-800 border-blue-200',
    CLINIC: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    LABORATORY: 'bg-amber-100 text-amber-800 border-amber-200',
    ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Activity size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-900 to-teal-900 bg-clip-text text-transparent">
                  MediLink
                </span>
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-teal-600 -mt-1">
                  AI Healthcare Hub
                </span>
              </div>
            </button>

            {/* Public Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate('/doctors')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPath.startsWith('/doctors') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Find Doctors
              </button>
              <button
                onClick={() => navigate('/diagnostic-tests')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPath.startsWith('/diagnostic-tests') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Compare Tests
              </button>
              <button
                onClick={() => navigate('/laboratories')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPath.startsWith('/laboratories') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Laboratories
              </button>
              <button
                onClick={() => navigate('/clinics')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPath.startsWith('/clinics') ? 'text-blue-600 bg-blue-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Clinics
              </button>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Local Healthcare Area Selector */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-50/80 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Change local healthcare search location"
            >
              <MapPin size={13} className="text-blue-600 shrink-0" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">{currentLocation.areaName}</span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded-full">
                {selectedRadius ? `${selectedRadius} mi` : 'All'}
              </span>
              <ChevronDown size={12} className="text-blue-500" />
            </button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                            className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold ${!n.isRead ? 'text-blue-900' : 'text-slate-700'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User / Login Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-800 line-clamp-1">{user.name}</p>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { navigate(getDashboardPath(user.role)); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Activity size={14} /> Go to {user.role} Dashboard
                    </button>

                    {user.role === 'PATIENT' && (
                      <button
                        onClick={() => { navigate('/patient/reports'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={14} className="text-teal-600" /> AI Report Assistant
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Join MediLink
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </header>
  );
};
