import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Users,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Volume2,
  Loader2,
  Sparkles,
  UserCheck,
  Plus,
  RefreshCw,
  Phone,
  ArrowRight,
  XCircle,
  RotateCcw,
  UserX,
  Stethoscope,
  Flame
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { Queue, QueueTicket } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { getSocket, joinQueueRoom, leaveQueueRoom, joinDoctorRoom, leaveDoctorRoom } from '../../services/socket.js';

// Clean Web Audio API chime
function playConsoleChime() {
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
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.35);       // C5
    playTone(659.25, now + 0.12, 0.35); // E5
    playTone(783.99, now + 0.25, 0.55); // G5
  } catch {
    // ignore
  }
}

export const DoctorQueueManagementPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED'>('ALL');
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInReason, setWalkInReason] = useState('');
  const [walkInPriority, setWalkInPriority] = useState('STANDARD');
  const [isAddingWalkIn, setIsAddingWalkIn] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const announceTimer = useRef<NodeJS.Timeout | null>(null);

  const doctorIdentifier = profile?.id || user?.id;

  const fetchQueue = async (silent = false) => {
    if (!doctorIdentifier) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.getDoctorQueue(doctorIdentifier);
      if (res.success && res.data) {
        setQueue(res.data.queue);
        setTickets(res.data.tickets);
        setCurrentTicket(res.data.currentTicket || null);
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
    if (doctorIdentifier) {
      joinDoctorRoom(doctorIdentifier);
    }
    if (queue?.id) {
      joinQueueRoom(queue.id);
    }

    const handleUpdate = (payload: any) => {
      fetchQueue(true);
      if (payload?.message) {
        setAnnouncement(payload.message);
        if (announceTimer.current) clearTimeout(announceTimer.current);
        announceTimer.current = setTimeout(() => setAnnouncement(null), 8000);
      }
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:live_change', handleUpdate);

    // Reliable fallback poll every 4 seconds
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (announceTimer.current) clearTimeout(announceTimer.current);
      if (doctorIdentifier) leaveDoctorRoom(doctorIdentifier);
      if (queue?.id) leaveQueueRoom(queue.id);
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:live_change', handleUpdate);
    };
  }, [doctorIdentifier, queue?.id]);

  const handleCallNext = async () => {
    if (!queue) return;
    setCalling(true);

    try {
      const res = await api.callNextPatient(queue.id);
      if (res.success && res.data) {
        setQueue(res.data.queue);
        setCurrentTicket(res.data.currentTicket);
        playConsoleChime();
        setAnnouncement(`🔔 Called Token #${res.data.currentTicket.tokenNumber} into consultation chamber.`);
        await fetchQueue(true);
      }
    } catch (err: any) {
      setAnnouncement(`Notice: ${err.message || 'No more waiting patients currently in queue.'}`);
    } finally {
      setCalling(false);
    }
  };

  const handleCallSpecific = async (ticketId: string, tokenNum: number) => {
    if (!queue) return;
    setActionLoadingId(ticketId);
    try {
      const res = await api.callSpecificTicket(queue.id, ticketId);
      if (res.success) {
        playConsoleChime();
        setAnnouncement(`🔔 Called Token #${tokenNum} into consultation chamber.`);
        await fetchQueue(true);
      }
    } catch (err: any) {
      setAnnouncement(`Error: ${err.message || 'Could not call ticket'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteCurrent = async () => {
    if (!queue) return;
    setActionLoadingId('complete-btn');
    try {
      const res = await api.completeConsultation(queue.id);
      if (res.success) {
        setAnnouncement('Consultation marked as completed.');
        await fetchQueue(true);
      }
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSkipTicket = async (ticketId: string) => {
    if (!queue) return;
    setActionLoadingId(ticketId);
    try {
      await api.skipTicket(queue.id, ticketId);
      await fetchQueue(true);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequeueTicket = async (ticketId: string) => {
    if (!queue) return;
    setActionLoadingId(ticketId);
    try {
      await api.requeueTicket(queue.id, ticketId);
      await fetchQueue(true);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdjustDelay = async (addedMinutes: number) => {
    if (!queue) return;
    const newDelay = addedMinutes === 0 ? 0 : Math.max(0, queue.delayMinutes + addedMinutes);
    try {
      const res = await api.updateQueueDelay(queue.id, { delayMinutes: newDelay });
      if (res.success && res.data) {
        setQueue(res.data);
        setAnnouncement(`Queue schedule updated: Current clinic delay is ${newDelay} minutes.`);
      }
    } catch {
      // ignore
    }
  };

  const handleStatusToggle = async (newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    if (!queue) return;
    try {
      const res = await api.updateQueueDelay(queue.id, { status: newStatus });
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queue || !walkInName.trim()) return;
    setIsAddingWalkIn(true);
    try {
      const res = await api.addWalkInPatient(queue.id, {
        patientName: walkInName.trim(),
        patientPhone: walkInPhone.trim(),
        reason: walkInReason.trim(),
        priority: walkInPriority
      });
      if (res.success) {
        setWalkInName('');
        setWalkInPhone('');
        setWalkInReason('');
        setIsWalkInModalOpen(false);
        setAnnouncement(`Walk-in registered: Token #${res.data.tokenNumber} issued.`);
        playConsoleChime();
        await fetchQueue(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add walk-in');
    } finally {
      setIsAddingWalkIn(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!queue) return;
    setSeedingDemo(true);
    try {
      const res = await api.seedDemoQueue(queue.id);
      if (res.success) {
        setAnnouncement('Queue populated with 4 active waiting OPD patients for demonstration.');
        playConsoleChime();
        await fetchQueue(true);
      }
    } catch {
      // ignore
    } finally {
      setSeedingDemo(false);
    }
  };

  const waitingTickets = tickets.filter(t => t.status === 'WAITING');
  const inConsultationTickets = tickets.filter(t => t.status === 'IN_CONSULTATION');
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED');
  const skippedTickets = tickets.filter(t => t.status === 'SKIPPED');

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const nextWaiting = waitingTickets[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Live OPD Queue Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Real-time WebSocket Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time outpatient consultation dispatcher. Calls tokens, controls delay, and synchronizes live patient tracking screens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Walk-in Patient</span>
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={seedingDemo}
            title="Populate 4 realistic waiting patients to test live token calling"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={seedingDemo ? 'animate-spin' : ''} />
            <span>{seedingDemo ? 'Populating...' : 'Seed Demo Queue'}</span>
          </button>
        </div>
      </div>

      {/* Announcement Notification */}
      {announcement && (
        <div className="p-3.5 bg-blue-600 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-blue-200 animate-pulse shrink-0" />
            <span>{announcement}</span>
          </div>
          <button
            onClick={() => setAnnouncement(null)}
            className="text-blue-200 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Controller Board */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden border border-blue-900/50">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${queue?.status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Chamber Status: {queue?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusToggle(queue?.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold backdrop-blur-xs transition-colors cursor-pointer"
              >
                {queue?.status === 'ACTIVE' ? 'Pause Room' : 'Resume Room'}
              </button>
            </div>
          </div>

          {/* Large Token Serving Number */}
          <div className="text-center py-4 relative z-10">
            <p className="text-xs uppercase font-extrabold tracking-widest text-blue-300">
              Now In Consultation Chamber
            </p>
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white font-mono">
                #{queue?.currentTokenNumber || 0}
              </span>
            </div>

            {currentTicket ? (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-200">
                <UserCheck size={16} className="text-emerald-400" />
                <span>Patient: {currentTicket.patientName || `Token #${currentTicket.tokenNumber}`}</span>
                {currentTicket.patientPhone && <span className="text-emerald-300/80">• {currentTicket.patientPhone}</span>}
              </div>
            ) : (
              <p className="text-xs text-blue-300/70 mt-2">
                No patient currently in consultation chamber. Click "Call Next Patient" to advance token.
              </p>
            )}
          </div>

          {/* Action Row: Call Next Patient & Complete */}
          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 pt-2 border-t border-white/10">
            <button
              onClick={handleCallNext}
              disabled={calling || waitingTickets.length === 0}
              className="w-full sm:flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {calling ? (
                <>
                  <Loader2 size={18} className="animate-spin text-slate-950" />
                  <span>Broadcasting Token Call...</span>
                </>
              ) : (
                <>
                  <Volume2 size={20} className="text-slate-950" />
                  <span>
                    Call Next Patient {nextWaiting ? `(Token #${nextWaiting.tokenNumber}: ${nextWaiting.patientName})` : '(No waiting)'}
                  </span>
                </>
              )}
            </button>

            {currentTicket && currentTicket.status === 'IN_CONSULTATION' && (
              <button
                onClick={handleCompleteCurrent}
                disabled={actionLoadingId === 'complete-btn'}
                className="w-full sm:w-auto px-5 py-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>Complete Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Delay & Schedule Manager */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Queue Delay Control</h3>
              <Clock size={16} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              If an emergency case arrives, add delay time to automatically update estimated wait times for all waiting patients across patient apps and monitors.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 my-4 text-center">
              <span className="text-[11px] font-bold uppercase text-slate-400">Current Clinic Delay</span>
              <p className="text-3xl font-black text-amber-600 mt-0.5">
                +{queue?.delayMinutes || 0} mins
              </p>
              <span className="text-[10px] text-slate-400">Added to all waiting tokens</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => handleAdjustDelay(5)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +5 Mins
              </button>
              <button
                onClick={() => handleAdjustDelay(10)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +10 Mins
              </button>
              <button
                onClick={() => handleAdjustDelay(15)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +15 Mins
              </button>
              <button
                onClick={() => handleAdjustDelay(0)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                Reset (0m)
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Avg. Consultation Duration:</span>
            <strong className="text-slate-900 font-bold">{queue?.averageConsultationMin || 15} mins</strong>
          </div>
        </div>
      </div>

      {/* Roster & Queue Control Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Patient Ticket Roster</h3>
            <p className="text-xs text-slate-500">
              {waitingTickets.length} waiting • {inConsultationTickets.length} in chamber • {completedTickets.length} completed • {skippedTickets.length} skipped
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('WAITING')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'WAITING' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Waiting ({waitingTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('IN_CONSULTATION')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'IN_CONSULTATION' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Chamber ({inConsultationTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('SKIPPED')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'SKIPPED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skipped ({skippedTickets.length})
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p>No patient tickets match the selected "{activeTab}" filter.</p>
            {activeTab === 'WAITING' && tickets.length === 0 && (
              <button
                onClick={handleSeedDemo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors inline-block"
              >
                Populate Sample Patients
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient Name & Contact</th>
                  <th className="py-3 px-4">Notes / Symptoms</th>
                  <th className="py-3 px-4">Estimated Turn</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(t => {
                  const isInChamber = t.status === 'IN_CONSULTATION';
                  const isWaiting = t.status === 'WAITING';
                  const isSkipped = t.status === 'SKIPPED';
                  const isCompleted = t.status === 'COMPLETED';

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isInChamber
                          ? 'bg-blue-50/80 font-semibold'
                          : isSkipped
                          ? 'bg-rose-50/40 text-slate-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`font-mono font-black text-sm ${isInChamber ? 'text-blue-700' : 'text-slate-900'}`}>
                          #{t.tokenNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.patientName}</div>
                        {t.patientPhone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} />
                            <span>{t.patientPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {t.notes || 'Outpatient Consultation'}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {isInChamber ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Sparkles size={13} /> IN ROOM
                          </span>
                        ) : isCompleted ? (
                          <span className="text-slate-400">Concluded</span>
                        ) : (
                          t.estimatedTime || 'Upcoming'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            isInChamber ? 'warning' :
                            isCompleted ? 'success' :
                            isSkipped ? 'danger' : 'primary'
                          }
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isWaiting && (
                            <>
                              <button
                                onClick={() => handleCallSpecific(t.id, t.tokenNumber)}
                                disabled={actionLoadingId === t.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <Volume2 size={12} />
                                <span>Call</span>
                              </button>

                              <button
                                onClick={() => handleSkipTicket(t.id)}
                                disabled={actionLoadingId === t.id}
                                title="Mark as Skipped / No show"
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                              >
                                Skip
                              </button>
                            </>
                          )}

                          {isInChamber && (
                            <button
                              onClick={handleCompleteCurrent}
                              disabled={actionLoadingId === 'complete-btn'}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} />
                              <span>Complete</span>
                            </button>
                          )}

                          {isSkipped && (
                            <button
                              onClick={() => handleRequeueTicket(t.id)}
                              disabled={actionLoadingId === t.id}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw size={12} />
                              <span>Re-queue</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Walk-in Registration Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Issue Walk-in OPD Token</h3>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Symptoms / Reason for Visit
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fever & persistent cough, follow-up"
                  value={walkInReason}
                  onChange={e => setWalkInReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingWalkIn || !walkInName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAddingWalkIn ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Generate Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
