import React, { useEffect, useState } from 'react';
import { Clock, Users, AlertCircle, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { getSocket, joinQueueRoom, leaveQueueRoom } from '../../services/socket.js';
import { QueueTicket, Queue } from '../../types/index.js';
import { api } from '../../services/api.js';

interface LiveQueueCardProps {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  patientTicket?: {
    id: string;
    queueId: string;
    tokenNumber: number;
    estimatedTime: string;
    status: any;
  } | null;
  onRefresh?: () => void;
}

export const LiveQueueCard: React.FC<LiveQueueCardProps> = ({
  doctorId,
  doctorName,
  specialty,
  patientTicket,
  onRefresh,
}) => {
  const [queueData, setQueueData] = useState<{
    queue: Queue;
    currentTicket?: QueueTicket;
    waitingCount: number;
    estimatedDelayMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await api.getDoctorQueue(doctorId);
      if (res.success && res.data) {
        setQueueData(res.data);
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
    if (queueData?.queue?.id) {
      joinQueueRoom(queueData.queue.id);
    }

    const handleQueueUpdate = (payload: any) => {
      fetchQueue();
      if (onRefresh) onRefresh();
      if (payload.message) {
        setLiveAlert(payload.message);
        setTimeout(() => setLiveAlert(null), 8000);
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:live_change', handleQueueUpdate);

    return () => {
      if (queueData?.queue?.id) {
        leaveQueueRoom(queueData.queue.id);
      }
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:live_change', handleQueueUpdate);
    };
  }, [doctorId, queueData?.queue?.id]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-slate-100 rounded mb-2"></div>
      </div>
    );
  }

  const currentToken = queueData?.queue?.currentTokenNumber || 0;
  const patientToken = patientTicket?.tokenNumber;
  const isMyTurn = patientToken !== undefined && patientToken === currentToken;
  const isPast = patientToken !== undefined && patientToken < currentToken;
  const aheadCount = patientToken ? Math.max(0, patientToken - currentToken - 1) : 0;

  return (
    <div className={`rounded-2xl border transition-all ${
      isMyTurn
        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-teal-500/25 border-emerald-400 p-6'
        : 'bg-white border-slate-200/80 shadow-xs p-5'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100/30">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
              Live OPD Queue Tracker
            </h3>
          </div>
          <p className={`text-sm font-bold mt-0.5 ${isMyTurn ? 'text-white' : 'text-slate-900'}`}>
            {doctorName} {specialty && <span className={`text-xs font-normal ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>({specialty})</span>}
          </p>
        </div>

        {queueData?.queue?.delayMinutes ? (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 ${
            isMyTurn ? 'bg-white/20 border-white/30 text-white' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertCircle size={13} /> +{queueData.queue.delayMinutes}m delay
          </span>
        ) : (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 ${
            isMyTurn ? 'bg-white/20 border-white/30 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Clock size={13} /> On Schedule
          </span>
        )}
      </div>

      {/* Live broadcast notification badge */}
      {liveAlert && (
        <div className="mt-3 px-3 py-2 bg-blue-500/20 border border-blue-400/30 rounded-xl text-xs font-medium flex items-center gap-2 text-white animate-in slide-in-from-top-2">
          <Volume2 size={15} />
          <span>{liveAlert}</span>
        </div>
      )}

      {/* Center tokens display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        {/* Current serving */}
        <div className={`p-3.5 rounded-xl border ${isMyTurn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
          <p className={`text-[11px] font-semibold ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
            Now In Room
          </p>
          <p className={`text-2xl font-black mt-1 ${isMyTurn ? 'text-white' : 'text-blue-600'}`}>
            Token #{currentToken > 0 ? currentToken : '—'}
          </p>
          <span className={`text-[10px] ${isMyTurn ? 'text-emerald-100' : 'text-slate-400'}`}>
            Consultation Active
          </span>
        </div>

        {/* Your token */}
        {patientToken && (
          <div className={`p-3.5 rounded-xl border ${
            isMyTurn
              ? 'bg-white text-slate-900 border-white shadow-lg'
              : 'bg-blue-50 border-blue-100 text-blue-950'
          }`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Your Token
            </p>
            <p className="text-2xl font-black mt-1 text-slate-900">
              #{patientToken}
            </p>
            <span className="text-[10px] font-semibold text-blue-700">
              {isMyTurn ? 'PLEASE ENTER ROOM' : isPast ? 'Consultation Completed' : `${aheadCount} ahead of you`}
            </span>
          </div>
        )}

        {/* Estimated Time */}
        <div className={`p-3.5 rounded-xl border col-span-2 sm:col-span-1 ${isMyTurn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
          <p className={`text-[11px] font-semibold ${isMyTurn ? 'text-emerald-100' : 'text-slate-500'}`}>
            Estimated Turn
          </p>
          <p className={`text-lg font-bold mt-1 ${isMyTurn ? 'text-white' : 'text-slate-800'}`}>
            {isMyTurn ? 'NOW' : patientTicket?.estimatedTime || '10-15 mins'}
          </p>
          <span className={`text-[10px] ${isMyTurn ? 'text-emerald-100' : 'text-slate-400'}`}>
            Live Auto-adjusted
          </span>
        </div>
      </div>

      {/* Progress & Alert Banner */}
      {isMyTurn ? (
        <div className="flex items-center gap-2 p-3 bg-white/20 rounded-xl border border-white/30 text-white font-semibold text-xs">
          <Sparkles size={16} className="animate-spin text-amber-300" />
          <span>Doctor is ready! Please proceed directly to consultation room.</span>
        </div>
      ) : isPast ? (
        <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Your appointment has concluded. You can review prescriptions and lab referrals.</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            <span>Total Patients in Line: <strong>{queueData?.waitingCount || 0}</strong></span>
          </div>
          <span className="text-[11px] text-teal-600 font-medium">
            Live WebSocket sync active
          </span>
        </div>
      )}
    </div>
  );
};
