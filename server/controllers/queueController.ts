import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { broadcastQueueUpdate, sendUserNotification } from '../sockets/queueSocket.js';
import { createNotification } from '../services/notificationService.js';
import { QueueTicket } from '../types/index.js';

// Helper to resolve doctor profile by either doctorId or userId
function resolveDoctor(identifier: string) {
  return db.findDoctorProfileById(identifier) || db.findDoctorProfileByUserId(identifier);
}

export async function getDoctorQueue(req: Request, res: Response) {
  try {
    const { doctorId } = req.params;
    const todayStr = new Date().toISOString().split('T')[0];

    const doctor = resolveDoctor(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    let queue = db.findQueueByDoctorAndDate(doctor.id, todayStr);

    if (!queue) {
      queue = {
        id: `que-${Date.now()}`,
        doctorId: doctor.id,
        clinicId: doctor.clinicId,
        date: todayStr,
        currentTokenNumber: 0,
        status: 'ACTIVE',
        averageConsultationMin: doctor.consultationDuration || 15,
        delayMinutes: 0,
        updatedAt: new Date().toISOString(),
      };
      db.addQueue(queue);
    }

    // Auto-sync confirmed appointments for today to ensure they have queue tickets
    const todayAppointments = db.getAppointments().filter(
      a => a.doctorId === doctor.id && a.date === todayStr && a.status !== 'CANCELLED'
    );
    const existingTickets = db.findQueueTicketsByQueueId(queue.id);

    for (const apt of todayAppointments) {
      const hasTicket = existingTickets.some(t => t.appointmentId === apt.id);
      if (!hasTicket) {
        const nextToken = (existingTickets.reduce((max, t) => Math.max(max, t.tokenNumber), 0) || 0) + 1;
        const waitMinutes = (nextToken - queue.currentTokenNumber) * queue.averageConsultationMin + queue.delayMinutes;
        const estTime = new Date(Date.now() + Math.max(5, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newTicket: QueueTicket = {
          id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          queueId: queue.id,
          appointmentId: apt.id,
          patientId: apt.patientId,
          tokenNumber: nextToken,
          estimatedTime: estTime,
          status: 'WAITING',
          checkInTime: new Date().toISOString()
        };
        db.addQueueTicket(newTicket);
        existingTickets.push(newTicket);
      }
    }

    // If still 0 tickets in this queue, auto-seed 3 active waiting OPD patients so the console is immediately functional
    if (existingTickets.length === 0) {
      const demoWalkIns = [
        { name: 'Rahul Sharma', phone: '+91 98765 43210', reason: 'Hypertension follow-up' },
        { name: 'Sunita Verma', phone: '+91 98112 33445', reason: 'Lipid panel consultation' },
        { name: 'Amit Saxena', phone: '+91 99220 55667', reason: 'Mild chest discomfort evaluation' },
      ];

      demoWalkIns.forEach((demo, idx) => {
        const tokenNum = idx + 1;
        const waitMins = tokenNum * queue!.averageConsultationMin;
        const estTime = new Date(Date.now() + waitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const ticket: any = {
          id: `tkt-seed-${Date.now()}-${idx}`,
          queueId: queue!.id,
          tokenNumber: tokenNum,
          estimatedTime: estTime,
          status: 'WAITING',
          checkInTime: new Date().toISOString(),
          patientName: demo.name,
          patientPhone: demo.phone,
          notes: demo.reason,
        };
        db.addQueueTicket(ticket);
        existingTickets.push(ticket);
      });
    }

    const tickets = db.findQueueTicketsByQueueId(queue.id);
    const allUsers = db.getUsers();
    const allPatients = db.getPatientProfiles();

    const enrichedTickets = tickets.map((t: any) => {
      let patientName = t.patientName;
      let patientPhone = t.patientPhone;

      if (t.patientId) {
        const patient = allPatients.find(p => p.id === t.patientId);
        const user = patient ? allUsers.find(u => u.id === patient.userId) : null;
        if (user) {
          patientName = user.name;
          patientPhone = user.phone;
        }
      }

      return {
        ...t,
        patientName: patientName || `Patient #${t.tokenNumber}`,
        patientPhone: patientPhone || 'N/A'
      };
    });

    enrichedTickets.sort((a, b) => a.tokenNumber - b.tokenNumber);

    const waitingTickets = enrichedTickets.filter(t => t.status === 'WAITING');
    const inConsultationTicket = enrichedTickets.find(t => t.status === 'IN_CONSULTATION');
    const currentTicket = inConsultationTicket || enrichedTickets.find(t => t.tokenNumber === queue?.currentTokenNumber);
    const completedTickets = enrichedTickets.filter(t => t.status === 'COMPLETED');
    const skippedTickets = enrichedTickets.filter(t => t.status === 'SKIPPED');

    return res.json({
      success: true,
      data: {
        queue,
        tickets: enrichedTickets,
        currentTicket: currentTicket || null,
        waitingCount: waitingTickets.length,
        completedCount: completedTickets.length,
        skippedCount: skippedTickets.length,
        estimatedDelayMinutes: queue.delayMinutes,
        avgConsultationMinutes: queue.averageConsultationMin,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve queue: ' + error.message });
  }
}

export async function callNextPatient(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: 'Queue not found.' });
    }

    const tickets = db.findQueueTicketsByQueueId(queue.id).sort((a, b) => a.tokenNumber - b.tokenNumber);

    // Find previous in consultation ticket and mark completed
    const prevInConsultation = tickets.find(t => t.status === 'IN_CONSULTATION');
    if (prevInConsultation) {
      db.updateQueueTicket(prevInConsultation.id, {
        status: 'COMPLETED',
        completedTime: new Date().toISOString()
      });
      if (prevInConsultation.appointmentId) {
        db.updateAppointment(prevInConsultation.appointmentId, { status: 'COMPLETED' });
      }
    }

    // Find next waiting ticket (prioritize tokens higher than current, or wrap around to any waiting)
    const nextTicket = tickets.find(t => t.status === 'WAITING' && t.tokenNumber > queue.currentTokenNumber) ||
                       tickets.find(t => t.status === 'WAITING');

    if (!nextTicket) {
      return res.status(400).json({ success: false, error: 'No more waiting patients in today\'s queue.' });
    }

    const now = new Date().toISOString();
    const updatedNext = db.updateQueueTicket(nextTicket.id, {
      status: 'IN_CONSULTATION',
      calledTime: now
    });

    if (nextTicket.appointmentId) {
      db.updateAppointment(nextTicket.appointmentId, { status: 'IN_PROGRESS' });
    }

    // Update queue's current token
    const updatedQueue = db.updateQueue(queue.id, {
      currentTokenNumber: nextTicket.tokenNumber,
      status: 'ACTIVE'
    });

    // Notify registered patient
    if (nextTicket.patientId) {
      const patient = db.findPatientProfileById(nextTicket.patientId);
      if (patient) {
        createNotification(
          patient.userId,
          'Your Turn! Doctor is Calling You',
          `Token #${nextTicket.tokenNumber}: Please proceed to the doctor consultation room immediately.`,
          'QUEUE',
          '/patient/appointments'
        );
        sendUserNotification(patient.userId, {
          title: 'Your Turn! Doctor is Calling You',
          message: `Token #${nextTicket.tokenNumber}: Please enter consultation chamber.`,
          tokenNumber: nextTicket.tokenNumber,
        });
      }
    }

    // Broadcast live update over Socket.IO to room & globally
    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: nextTicket.tokenNumber,
      calledToken: nextTicket.tokenNumber,
      status: updatedQueue?.status || queue.status,
      delayMinutes: updatedQueue?.delayMinutes || queue.delayMinutes,
      message: `🔔 Now Serving Token #${nextTicket.tokenNumber}: Please enter consultation room.`
    });

    return res.json({
      success: true,
      message: `Called Token #${nextTicket.tokenNumber}`,
      data: {
        queue: updatedQueue,
        currentTicket: updatedNext
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to advance queue: ' + error.message });
  }
}

export async function callSpecificTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId, ticketId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    const ticket = db.findQueueTicketsByQueueId(queue.id).find(t => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found.' });

    // Complete previous consultation
    const tickets = db.findQueueTicketsByQueueId(queue.id);
    const prev = tickets.find(t => t.status === 'IN_CONSULTATION');
    if (prev && prev.id !== ticket.id) {
      db.updateQueueTicket(prev.id, { status: 'COMPLETED', completedTime: new Date().toISOString() });
      if (prev.appointmentId) db.updateAppointment(prev.appointmentId, { status: 'COMPLETED' });
    }

    const now = new Date().toISOString();
    const updatedTicket = db.updateQueueTicket(ticket.id, { status: 'IN_CONSULTATION', calledTime: now });
    if (ticket.appointmentId) db.updateAppointment(ticket.appointmentId, { status: 'IN_PROGRESS' });

    const updatedQueue = db.updateQueue(queue.id, { currentTokenNumber: ticket.tokenNumber });

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: ticket.tokenNumber,
      calledToken: ticket.tokenNumber,
      status: updatedQueue?.status,
      message: `🔔 Doctor called Token #${ticket.tokenNumber} into consultation room.`
    });

    return res.json({ success: true, message: `Called Token #${ticket.tokenNumber}`, data: { queue: updatedQueue, ticket: updatedTicket } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function completeCurrentConsultation(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    const tickets = db.findQueueTicketsByQueueId(queue.id);
    const current = tickets.find(t => t.status === 'IN_CONSULTATION' || t.tokenNumber === queue.currentTokenNumber);

    if (current && current.status !== 'COMPLETED') {
      db.updateQueueTicket(current.id, { status: 'COMPLETED', completedTime: new Date().toISOString() });
      if (current.appointmentId) db.updateAppointment(current.appointmentId, { status: 'COMPLETED' });
    }

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      status: queue.status,
      message: `Token #${queue.currentTokenNumber} consultation completed.`
    });

    return res.json({ success: true, message: 'Consultation marked completed.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function skipTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId, ticketId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    const ticket = db.findQueueTicketsByQueueId(queue.id).find(t => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found.' });

    db.updateQueueTicket(ticket.id, { status: 'SKIPPED' });

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      message: `Token #${ticket.tokenNumber} skipped / marked absent.`
    });

    return res.json({ success: true, message: `Token #${ticket.tokenNumber} marked as skipped.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function requeueTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId, ticketId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    const ticket = db.findQueueTicketsByQueueId(queue.id).find(t => t.id === ticketId);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found.' });

    db.updateQueueTicket(ticket.id, { status: 'WAITING' });

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      message: `Token #${ticket.tokenNumber} re-added to waiting line.`
    });

    return res.json({ success: true, message: `Token #${ticket.tokenNumber} moved back to waiting.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function addWalkInPatient(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId } = req.params;
    const { patientName, patientPhone, reason, priority } = req.body;

    if (!patientName) {
      return res.status(400).json({ success: false, error: 'Patient name is required for walk-in OPD registration.' });
    }

    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    const existingTickets = db.findQueueTicketsByQueueId(queue.id);
    const maxToken = existingTickets.reduce((max, t) => Math.max(max, t.tokenNumber), 0);
    const nextToken = maxToken + 1;

    const waitTokens = Math.max(0, nextToken - queue.currentTokenNumber);
    const waitMinutes = waitTokens * queue.averageConsultationMin + queue.delayMinutes;
    const estTimeStr = new Date(Date.now() + Math.max(5, waitMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTicket: any = {
      id: `tkt-walkin-${Date.now()}`,
      queueId: queue.id,
      tokenNumber: nextToken,
      estimatedTime: estTimeStr,
      status: 'WAITING',
      checkInTime: new Date().toISOString(),
      patientName,
      patientPhone: patientPhone || '+91 Walk-in',
      notes: reason || 'Walk-in OPD Consultation',
      priority: priority || 'STANDARD'
    };

    db.addQueueTicket(newTicket);

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      totalTickets: existingTickets.length + 1,
      message: `New Walk-in registered: Token #${nextToken} (${patientName}).`
    });

    return res.status(201).json({
      success: true,
      message: `Walk-in Token #${nextToken} issued for ${patientName}`,
      data: newTicket
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to add walk-in: ' + error.message });
  }
}

export async function checkInAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, error: 'Appointment ID required.' });
    }

    const apt = db.findAppointmentById(appointmentId);
    if (!apt) return res.status(404).json({ success: false, error: 'Appointment not found.' });

    const existingTicket = db.findQueueTicketByAppointmentId(apt.id);
    if (existingTicket) {
      return res.json({ success: true, message: 'Already checked in.', data: existingTicket });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let queue = db.findQueueByDoctorAndDate(apt.doctorId, todayStr);
    if (!queue) {
      const doctor = db.findDoctorProfileById(apt.doctorId);
      queue = {
        id: `que-${Date.now()}`,
        doctorId: apt.doctorId,
        clinicId: apt.clinicId,
        date: todayStr,
        currentTokenNumber: 0,
        status: 'ACTIVE',
        averageConsultationMin: doctor?.consultationDuration || 15,
        delayMinutes: 0,
        updatedAt: new Date().toISOString()
      };
      db.addQueue(queue);
    }

    const existingTickets = db.findQueueTicketsByQueueId(queue.id);
    const nextToken = (existingTickets.reduce((max, t) => Math.max(max, t.tokenNumber), 0) || 0) + 1;
    const waitMinutes = Math.max(5, (nextToken - queue.currentTokenNumber) * queue.averageConsultationMin + queue.delayMinutes);
    const estTime = new Date(Date.now() + waitMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTicket: QueueTicket = {
      id: `tkt-${Date.now()}`,
      queueId: queue.id,
      appointmentId: apt.id,
      patientId: apt.patientId,
      tokenNumber: nextToken,
      estimatedTime: estTime,
      status: 'WAITING',
      checkInTime: new Date().toISOString()
    };

    db.addQueueTicket(newTicket);

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      message: `Patient checked in: Token #${nextToken} added to queue.`
    });

    return res.status(201).json({
      success: true,
      message: `Checked in successfully! You are assigned Token #${nextToken}.`,
      data: newTicket
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to check in: ' + error.message });
  }
}

export async function resetOrSeedDemoQueue(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId } = req.params;
    const queue = db.findQueueById(queueId);
    if (!queue) return res.status(404).json({ success: false, error: 'Queue not found.' });

    // Remove existing demo tickets for this queue
    const allTickets = db.getQueueTickets();
    const otherTickets = allTickets.filter(t => t.queueId !== queue.id);
    // Replace in store
    (db as any).data.queueTickets = otherTickets;

    const freshPatients = [
      { name: 'Rahul Sharma', phone: '+91 98765 43210', reason: 'Blood pressure review & cardiology follow-up' },
      { name: 'Sunita Verma', phone: '+91 98112 33445', reason: 'Lipid report & dietary consultation' },
      { name: 'Amit Saxena', phone: '+91 99220 55667', reason: 'ECG review & mild dyspnea evaluation' },
      { name: 'Priya Gupta', phone: '+91 97118 44221', reason: 'General wellness & prescription renewal' },
    ];

    freshPatients.forEach((p, idx) => {
      const tokenNum = idx + 1;
      const waitMins = tokenNum * queue.averageConsultationMin;
      const estTime = new Date(Date.now() + waitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      db.addQueueTicket({
        id: `tkt-demo-${Date.now()}-${idx}`,
        queueId: queue.id,
        tokenNumber: tokenNum,
        estimatedTime: estTime,
        status: 'WAITING',
        checkInTime: new Date().toISOString(),
        patientName: p.name,
        patientPhone: p.phone,
        notes: p.reason
      } as any);
    });

    const updatedQueue = db.updateQueue(queue.id, { currentTokenNumber: 0, status: 'ACTIVE', delayMinutes: 0 });

    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: 0,
      message: 'Queue reset with fresh OPD patient roster.'
    });

    return res.json({
      success: true,
      message: 'Queue seeded with 4 waiting OPD patients.',
      data: updatedQueue
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateQueueDelay(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId } = req.params;
    const { delayMinutes, status } = req.body;

    const queue = db.findQueueById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, error: 'Queue not found.' });
    }

    const updates: any = {};
    if (delayMinutes !== undefined) updates.delayMinutes = Number(delayMinutes);
    if (status !== undefined) updates.status = status;

    const updated = db.updateQueue(queue.id, updates);

    // Recalculate estimated times for waiting tickets
    const tickets = db.findQueueTicketsByQueueId(queue.id);
    tickets.forEach(t => {
      if (t.status === 'WAITING' && updated) {
        const waitTokens = Math.max(0, t.tokenNumber - updated.currentTokenNumber);
        const waitMins = waitTokens * updated.averageConsultationMin + updated.delayMinutes;
        const estTime = new Date(Date.now() + Math.max(5, waitMins) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        db.updateQueueTicket(t.id, { estimatedTime: estTime });
      }
    });

    // Broadcast to waiting patients
    broadcastQueueUpdate(queue.id, queue.doctorId, {
      queueId: queue.id,
      doctorId: queue.doctorId,
      currentToken: queue.currentTokenNumber,
      delayMinutes: updated?.delayMinutes,
      status: updated?.status,
      message: delayMinutes !== undefined ? `Queue schedule updated: Current clinic delay is ${delayMinutes} minutes.` : `Queue status: ${status}`
    });

    return res.json({ success: true, message: 'Queue settings updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update delay: ' + error.message });
  }
}
