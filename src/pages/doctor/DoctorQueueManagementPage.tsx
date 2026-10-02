import React, { useState, useEffect } from 'react';
import { Clock, Users, Play, Pause, AlertCircle, CheckCircle2, ChevronRight, Volume2, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { Queue, QueueTicket } from '../../types/index.js';
import { Badge } from '../../components/common/Badge.js';
import { getSocket, joinQueueRoom, leaveQueueRoom } from '../../services/socket.js';

export const DoctorQueueManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(0);

  const fetchQueue = async () => {
    if (!profile?.id) return;
    try {
      const res = await api.getDoctorQueue(profile.id);
      if (res.success && res.data) {
        setQueue(res.data.queue);
        setTickets(res.data.tickets);
        setCurrentTicket(res.data.currentTicket || null);
        setDelayMinutes(res.data.queue.delayMinutes || 0);
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
    if (queue?.id) {
      joinQueueRoom(queue.id);
    }

    const handleUpdate = () => {
      fetchQueue();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:live_change', handleUpdate);

    return () => {
      if (queue?.id) leaveQueueRoom(queue.id);
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:live_change', handleUpdate);
    };
  }, [profile?.id, queue?.id]);

  const handleCallNext = async () => {
    if (!queue) return;
    setCalling(true);
    setAnnouncement(null);

    try {
      const res = await api.callNextPatient(queue.id);
      if (res.success && res.data) {
        setQueue(res.data.queue);
        setCurrentTicket(res.data.currentTicket);
        setAnnouncement(`🔔 Called Token #${res.data.currentTicket.tokenNumber} into consultation room.`);
        await fetchQueue();
      }
    } catch (err: any) {
      setAnnouncement(`Notice: ${err.message || 'No more waiting patients currently in queue.'}`);
    } finally {
      setCalling(false);
    }
  };

  const handleAdjustDelay = async (addedMinutes: number) => {
    if (!queue) return;
    const newDelay = Math.max(0, queue.delayMinutes + addedMinutes);
    try {
      const res = await api.updateQueueDelay(queue.id, { delayMinutes: newDelay });
      if (res.success && res.data) {
        setQueue(res.data);
        setDelayMinutes(newDelay);
        setAnnouncement(`Queue schedule updated: Current clinic delay is now ${newDelay} minutes.`);
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

  const waitingTickets = tickets.filter(t => t.status === 'WAITING');
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Live OPD Queue Console</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Authoritative real-time queue dispatcher. Advances patient tokens and broadcasts instant websocket updates to patients.
        </p>
      </div>

      {announcement && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-bold flex items-center gap-2 animate-in fade-in">
          <Volume2 size={16} className="text-blue-600" />
          <span>{announcement}</span>
        </div>
      )}

      {/* Main Console Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Controller */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${queue?.status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Live Status: {queue?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusToggle(queue?.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
              >
                {queue?.status === 'ACTIVE' ? 'Pause Queue' : 'Resume Queue'}
              </button>
            </div>
          </div>

          {/* Large Token Serving Number */}
          <div className="text-center py-4">
            <p className="text-xs uppercase font-bold tracking-widest text-blue-200">
              Currently In Room
            </p>
            <p className="text-6xl sm:text-7xl font-black tracking-tight text-white mt-2">
              #{queue?.currentTokenNumber || 0}
            </p>
            {currentTicket && (
              <p className="text-sm font-semibold text-emerald-300 mt-2 flex items-center justify-center gap-1.5">
                <UserCheck size={16} />
                <span>Patient: {currentTicket.patientName || 'Consultation in Progress'}</span>
              </p>
            )}
          </div>

          {/* Action: Call Next Patient */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCallNext}
              disabled={calling || waitingTickets.length === 0}
              className="w-full sm:flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {calling ? (
                <>
                  <Loader2 size={18} className="animate-spin text-slate-950" />
                  <span>Broadcasting Call...</span>
                </>
              ) : (
                <>
                  <Volume2 size={20} className="text-slate-950" />
                  <span>Call Next Patient (Token #{queue ? queue.currentTokenNumber + 1 : 1})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delay & Schedule Manager */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Queue Delay Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If an emergency case arrives, add delay time to automatically update estimated wait times for all waiting patients.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 my-4 text-center">
              <span className="text-[11px] font-bold uppercase text-slate-400">Current Delay</span>
              <p className="text-3xl font-black text-amber-600 mt-0.5">
                +{queue?.delayMinutes || 0} mins
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleAdjustDelay(5)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +5 Mins Delay
              </button>
              <button
                onClick={() => handleAdjustDelay(10)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +10 Mins Delay
              </button>
              <button
                onClick={() => handleAdjustDelay(15)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                +15 Mins Delay
              </button>
              <button
                onClick={() => handleAdjustDelay(-(queue?.delayMinutes || 0))}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                Reset Delay (0m)
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Avg. Consultation:</span>
            <strong className="text-slate-800">{queue?.averageConsultationMin || 15} minutes</strong>
          </div>
        </div>
      </div>

      {/* Waiting Roster */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Patient Ticket Roster</h3>
            <p className="text-xs text-slate-500">
              {waitingTickets.length} waiting • {completedTickets.length} completed
            </p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No patient tickets issued for today's queue yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Estimated Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(t => (
                  <tr key={t.id} className={t.status === 'IN_CONSULTATION' ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      #{t.tokenNumber}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.patientName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.estimatedTime}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          t.status === 'IN_CONSULTATION' ? 'warning' :
                          t.status === 'COMPLETED' ? 'success' : 'primary'
                        }
                        size="sm"
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {t.status === 'WAITING' && (
                        <button
                          onClick={handleCallNext}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
