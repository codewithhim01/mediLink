import React, { useEffect, useState, useRef } from 'react';
import { Clock, Users, AlertCircle, Volume2, Sparkles, CheckCircle2, UserCheck, RefreshCw, LogIn } from 'lucide-react';
import { getSocket, joinQueueRoom, leaveQueueRoom, joinDoctorRoom, leaveDoctorRoom } from '../../services/socket.js';
import { QueueTicket, Queue } from '../../types/index.js';
import { api } from '../../services/api.js';

interface LiveQueueCardProps {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  appointmentId?: string;
  patientTicket?: {
    id: string;
    queueId: string;
    tokenNumber: number;
    estimatedTime: string;
    status: any;
  } | null;
  onRefresh?: () => void;
}

// Gentle pleasant synthetic chime via Web Audio API (zero external assets needed)
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.4);       // C5
    playTone(659.25, now + 0.15, 0.4); // E5
    playTone(783.99, now + 0.3, 0.6);  // G5
  } catch {
    // audio context might be blocked if no user interaction yet
  }
}

export const LiveQueueCard: React.FC<LiveQueueCardProps> = ({
  doctorId,
  doctorName,
  specialty,
  appointmentId,
  patientTicket,
  onRefresh,
}) => {
  const [queueData, setQueueData] = useState<{
    queue: Queue;
    currentTicket?: QueueTicket;
    waitingCount: number;
    completedCount: number;
    estimatedDelayMinutes: number;
    avgConsultationMinutes: number;
  } | null>(null);
  const [currentLocalTicket, setCurrentLocalTicket] = useState(patientTicket || null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQueue = async (silent = false) => {
    if (!doctorId) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.getDoctorQueue(doctorId);
      if (res.success && res.data) {
        setQueueData(res.data);
        setLastUpdated(new Date());

        // If local patient ticket was passed or can be found in queue tickets
        if (patientTicket?.tokenNumber) {
          setCurrentLocalTicket(patientTicket);
        } else if (res.data.tickets && appointmentId) {
          const match = res.data.tickets.find((t: any) => t.appointmentId === appointmentId);
          if (match) setCurrentLocalTicket(match);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const socket = getSocket();
    if (doctorId) {
      joinDoctorRoom(doctorId);
    }
    if (queueData?.queue?.id) {
      joinQueueRoom(queueData.queue.id);
    }

    const handleQueueUpdate = (payload: any) => {
      // Check if update applies to this queue or doctor
      if (!payload || payload.doctorId === doctorId || payload.queueId === queueData?.queue?.id || !payload.queueId) {
        fetchQueue(true);
        if (onRefresh) onRefresh();

        if (payload.message) {
          setLiveAlert(payload.message);
          playChime();
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          alertTimerRef.current = setTimeout(() => setLiveAlert(null), 9000);
        }
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:live_change', handleQueueUpdate);

    // Reliable fallback poll every 5 seconds to ensure live OPD sync even in sandbox
    const pollInterval = setInterval(() => {
      fetchQueue(true);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (doctorId) leaveDoctorRoom(doctorId);
      if (queueData?.queue?.id) leaveQueueRoom(queueData.queue.id);
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:live_change', handleQueueUpdate);
    };
  }, [doctorId, queueData?.queue?.id, appointmentId]);

  const handleCheckIn = async () => {
    if (!appointmentId) return;
    setCheckingIn(true);
    try {
      const res = await api.checkInAppointment(appointmentId);
      if (res.success && res.data) {
        setCurrentLocalTicket(res.data);
        setLiveAlert(`Checked In! Your Queue Token is #${res.data.tokenNumber}`);
        playChime();
        await fetchQueue(true);
        if (onRefresh) onRefresh();
      }
    } catch {
      // ignore
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading && !queueData) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const currentToken = queueData?.queue?.currentTokenNumber || 0;
  const activeToken = currentLocalTicket?.tokenNumber;
  const isMyTurn = activeToken !== undefined && activeToken === currentToken && currentToken > 0;
  const isPast = activeToken !== undefined && activeToken < currentToken && currentToken > 0;
  const aheadCount = activeToken ? Math.max(0, activeToken - currentToken - 1) : 0;
  const isPaused = queueData?.queue?.status === 'PAUSED';

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isMyTurn
          ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-xl shadow-emerald-600/25 border-emerald-400 p-5 sm:p-6'
          : isPaused
          ? 'bg-amber-50/70 border-amber-200 text-slate-900 shadow-xs p-5'
          : 'bg-white border-slate-200/90 shadow-xs p-5'
      }`}
    >
      {/* Background glow accent for active turn */}
      {isMyTurn && (
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/40">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMyTurn
                  ? 'bg-white animate-ping'
                  : isPaused
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
              Live OPD Queue Tracker
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isPaused
                ? 'bg-amber-100 text-amber-800'
                : isMyTurn
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isPaused ? 'OPD Paused' : 'Live Sync'}
            </span>
          </div>

          <p className={`text-sm sm:text-base font-black mt-0.5 ${isMyTurn ? 'text-white' : 'text-slate-900'}`}>
            {doctorName}{' '}
            {specialty && (
              <span className={`text-xs font-normal ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
                ({specialty})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {queueData?.queue?.delayMinutes ? (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
              isMyTurn ? 'bg-white/20 border-white/30 text-white' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <AlertCircle size={13} /> +{queueData.queue.delayMinutes}m delay
            </span>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
              isMyTurn ? 'bg-white/20 border-white/30 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Clock size={13} /> On Schedule
            </span>
          )}

          <button
            onClick={() => fetchQueue(false)}
            title="Refresh Live Queue"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isMyTurn ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Live announcement alert banner */}
      {liveAlert && (
        <div className="mt-3 px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 shadow-md">
          <Volume2 size={16} className="text-blue-200 shrink-0 animate-bounce" />
          <span>{liveAlert}</span>
        </div>
      )}

      {/* Main token display grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        {/* Current serving token */}
        <div className={`p-3.5 rounded-xl border ${isMyTurn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200/80'}`}>
          <p className={`text-[11px] font-semibold ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
            Now In Room
          </p>
          <p className={`text-2xl sm:text-3xl font-black mt-1 ${isMyTurn ? 'text-white' : 'text-blue-600'}`}>
            #{currentToken > 0 ? currentToken : '—'}
          </p>
          <span className={`text-[10px] font-semibold ${isMyTurn ? 'text-emerald-100' : 'text-slate-400'}`}>
            {currentToken > 0 ? 'Consultation Active' : 'Waiting for Doctor'}
          </span>
        </div>

        {/* Patient's personal token or check-in button */}
        {activeToken ? (
          <div
            className={`p-3.5 rounded-xl border ${
              isMyTurn
                ? 'bg-white text-slate-900 border-white shadow-lg'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Your Token
            </p>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-slate-900">
              #{activeToken}
            </p>
            <span className="text-[10px] font-bold text-blue-700">
              {isMyTurn ? 'PLEASE ENTER ROOM' : isPast ? 'Consultation Concluded' : `${aheadCount} patient(s) ahead`}
            </span>
          </div>
        ) : appointmentId ? (
          <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase text-amber-800">Queue Check-in</p>
              <p className="text-xs text-slate-600 mt-1">Get your live OPD token</p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogIn size={13} />
              <span>{checkingIn ? 'Issuing...' : 'Check In Now'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-500">Queue Load</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {queueData?.waitingCount || 0}
            </p>
            <span className="text-[10px] text-slate-400">Waiting Patients</span>
          </div>
        )}

        {/* Estimated Turn Time */}
        <div className={`p-3.5 rounded-xl border col-span-2 sm:col-span-1 ${isMyTurn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200/80'}`}>
          <p className={`text-[11px] font-semibold ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
            Estimated Turn
          </p>
          <p className={`text-lg sm:text-xl font-bold mt-1 ${isMyTurn ? 'text-white' : 'text-slate-800'}`}>
            {isMyTurn ? 'NOW' : currentLocalTicket?.estimatedTime || `${(queueData?.waitingCount || 0) * (queueData?.avgConsultationMinutes || 15)} mins`}
          </p>
          <span className={`text-[10px] ${isMyTurn ? 'text-emerald-100' : 'text-slate-400'}`}>
            Live Auto-adjusted
          </span>
        </div>
      </div>

      {/* Status banner */}
      {isMyTurn ? (
        <div className="flex items-center gap-2.5 p-3.5 bg-white/20 rounded-xl border border-white/30 text-white font-bold text-xs shadow-inner">
          <Sparkles size={18} className="animate-spin text-amber-300 shrink-0" />
          <span>Doctor is ready! Please enter consultation chamber now with your Token #{activeToken}.</span>
        </div>
      ) : isPast ? (
        <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Your appointment has concluded. You can review prescriptions and lab referrals.</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100/50">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            <span>Total Waiting Outside: <strong>{queueData?.waitingCount || 0}</strong></span>
          </div>
          <span className="text-[10px] text-teal-600 font-medium">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
};
