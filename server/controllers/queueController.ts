import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { broadcastQueueUpdate, sendUserNotification } from '../sockets/queueSocket.js';
import { createNotification } from '../services/notificationService.js';

export async function getDoctorQueue(req: Request, res: Response) {
  try {
    const { doctorId } = req.params;
    const todayStr = new Date().toISOString().split('T')[0];

    let queue = db.findQueueByDoctorAndDate(doctorId, todayStr);
    const doctor = db.findDoctorProfileById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

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

    const tickets = db.findQueueTicketsByQueueId(queue.id);
    const allUsers = db.getUsers();
    const allPatients = db.getPatientProfiles();

    const enrichedTickets = tickets.map(t => {
      const patient = allPatients.find(p => p.id === t.patientId);
      const user = patient ? allUsers.find(u => u.id === patient.userId) : null;
      return {
        ...t,
        patientName: user ? user.name : `Patient #${t.tokenNumber}`,
        patientPhone: user?.phone
      };
    });

    enrichedTickets.sort((a, b) => a.tokenNumber - b.tokenNumber);

    const waitingTickets = enrichedTickets.filter(t => t.status === 'WAITING');
    const currentTicket = enrichedTickets.find(t => t.tokenNumber === queue?.currentTokenNumber);

    return res.json({
      success: true,
      data: {
        queue,
        tickets: enrichedTickets,
        currentTicket,
        waitingCount: waitingTickets.length,
        completedCount: enrichedTickets.filter(t => t.status === 'COMPLETED').length,
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
      // Mark appointment completed
      db.updateAppointment(prevInConsultation.appointmentId, { status: 'COMPLETED' });
    }

    // Find next waiting ticket
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

    db.updateAppointment(nextTicket.appointmentId, { status: 'IN_PROGRESS' });

    // Update queue's current token
    const updatedQueue = db.updateQueue(queue.id, {
      currentTokenNumber: nextTicket.tokenNumber
    });

    // Notify patient
    const patient = db.findPatientProfileById(nextTicket.patientId);
    if (patient) {
      createNotification(
        patient.userId,
        'Your Turn! Doctor is Calling You',
        `Token #${nextTicket.tokenNumber}: Please proceed to the doctor consultation room immediately.`,
        'QUEUE',
        '/patient/appointments'
      );
    }

    // Broadcast live update over Socket.IO
    broadcastQueueUpdate(queue.id, {
      queueId: queue.id,
      currentToken: nextTicket.tokenNumber,
      calledToken: nextTicket.tokenNumber,
      status: queue.status,
      delayMinutes: queue.delayMinutes,
      message: `Token #${nextTicket.tokenNumber} has been called into consultation room.`
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

    // Broadcast to waiting patients
    broadcastQueueUpdate(queue.id, {
      queueId: queue.id,
      currentToken: queue.currentTokenNumber,
      delayMinutes: updated?.delayMinutes,
      status: updated?.status,
      message: delayMinutes ? `Queue schedule updated: Current clinic delay is ${delayMinutes} minutes.` : undefined
    });

    return res.json({ success: true, message: 'Queue settings updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update delay: ' + error.message });
  }
}
