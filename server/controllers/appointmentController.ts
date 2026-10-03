import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Appointment, QueueTicket } from '../types/index.js';
import { createNotification } from '../services/notificationService.js';
import { broadcastQueueUpdate } from '../sockets/queueSocket.js';
import { logAudit } from '../services/auditService.js';

export async function getAppointments(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const allAppointments = db.getAppointments();
    const allUsers = db.getUsers();
    const allDoctors = db.getDoctorProfiles();
    const allPatients = db.getPatientProfiles();
    const allClinics = db.getClinics();
    const allTickets = db.getQueueTickets();

    let list = allAppointments;

    if (req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (!patient) return res.json({ success: true, data: [] });
      list = list.filter(a => a.patientId === patient.id);
    } else if (req.user.role === 'DOCTOR') {
      const doc = db.findDoctorProfileByUserId(req.user.userId);
      if (!doc) return res.json({ success: true, data: [] });
      list = list.filter(a => a.doctorId === doc.id);
    } else if (req.user.role === 'CLINIC') {
      const clinic = db.findClinicByUserId(req.user.userId);
      if (!clinic) return res.json({ success: true, data: [] });
      list = list.filter(a => a.clinicId === clinic.id);
    }

    const enriched = list.map(apt => {
      const patientProf = allPatients.find(p => p.id === apt.patientId);
      const patientUser = patientProf ? allUsers.find(u => u.id === patientProf.userId) : null;
      const docProf = allDoctors.find(d => d.id === apt.doctorId);
      const docUser = docProf ? allUsers.find(u => u.id === docProf.userId) : null;
      const clinic = allClinics.find(c => c.id === apt.clinicId);
      const ticket = allTickets.find(t => t.appointmentId === apt.id);

      return {
        ...apt,
        patientName: patientUser ? patientUser.name : 'Unknown Patient',
        patientEmail: patientUser?.email,
        patientPhone: patientUser?.phone,
        patientDob: patientProf?.dob,
        patientBloodGroup: patientProf?.bloodGroup,
        doctorName: docUser ? docUser.name : 'Unknown Doctor',
        doctorSpecialty: docProf?.specialty,
        clinicName: clinic ? clinic.name : 'Specialist Practice',
        clinicAddress: clinic ? clinic.address : 'Lucknow, UP',
        queueTicket: ticket ? {
          id: ticket.id,
          queueId: ticket.queueId,
          tokenNumber: ticket.tokenNumber,
          estimatedTime: ticket.estimatedTime,
          status: ticket.status
        } : null
      };
    });

    // Sort by date descending
    enriched.sort((a, b) => b.date.localeCompare(a.date));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve appointments: ' + error.message });
  }
}

export async function createAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, error: 'Only registered patients can book appointments.' });
    }

    const patient = db.findPatientProfileByUserId(req.user.userId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found.' });
    }

    const { doctorId, date, timeSlot, type, symptoms } = req.body;
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, error: 'Doctor, date, and time slot are required.' });
    }

    const doctor = db.findDoctorProfileById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Selected doctor not found.' });
    }

    const doctorUser = db.findUserById(doctor.userId);
    const now = new Date().toISOString();
    const aptNumber = `APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: aptNumber,
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: doctor.clinicId,
      date,
      timeSlot,
      type: type === 'TELECONSULT' ? 'TELECONSULT' : 'IN_PERSON',
      status: 'CONFIRMED',
      symptoms: symptoms || '',
      feePaid: doctor.consultationFee,
      createdAt: now,
      updatedAt: now,
    };

    db.addAppointment(newAppointment);

    // Queue assignment: if appointment date matches today, attach or create active queue
    const todayStr = new Date().toISOString().split('T')[0];
    let queueTicket: QueueTicket | null = null;

    if (date === todayStr) {
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
          updatedAt: now,
        };
        db.addQueue(queue);
      }

      const existingTickets = db.findQueueTicketsByQueueId(queue.id);
      const nextToken = existingTickets.length + 1;
      
      // Calculate estimated time based on current token & delay
      const waitTokens = Math.max(0, nextToken - queue.currentTokenNumber);
      const waitMinutes = waitTokens * queue.averageConsultationMin + queue.delayMinutes;
      const estTimeObj = new Date(Date.now() + waitMinutes * 60000);
      const estTimeStr = estTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      queueTicket = {
        id: `qtk-${Date.now()}`,
        queueId: queue.id,
        appointmentId: newAppointment.id,
        patientId: patient.id,
        tokenNumber: nextToken,
        estimatedTime: estTimeStr,
        status: 'WAITING',
        checkInTime: now,
      };

      db.addQueueTicket(queueTicket);

      broadcastQueueUpdate(queue.id, {
        currentToken: queue.currentTokenNumber,
        delayMinutes: queue.delayMinutes,
        status: queue.status,
        totalTickets: existingTickets.length + 1
      });
    }

    // Create notifications
    createNotification(
      req.user.userId,
      'Appointment Confirmed',
      `Your appointment with ${doctorUser?.name || 'Dr. Specialist'} is confirmed for ${date} at ${timeSlot}.${queueTicket ? ` You have been assigned Queue Token #${queueTicket.tokenNumber}.` : ''}`,
      'APPOINTMENT',
      '/patient/appointments'
    );

    createNotification(
      doctor.userId,
      'New Appointment Booked',
      `Patient ${req.user.name} has booked an appointment for ${date} at ${timeSlot}.`,
      'APPOINTMENT',
      '/doctor/appointments'
    );

    logAudit(req.user.userId, 'APPOINTMENT_BOOKED', 'APPOINTMENT', newAppointment.id, {
      appointmentNumber: aptNumber,
      doctorId: doctor.id,
      date,
      timeSlot
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: {
        ...newAppointment,
        queueTicket
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create appointment: ' + error.message });
  }
}

export async function updateAppointmentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const apt = db.findAppointmentById(id);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    const updates: Partial<Appointment> = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;

    const updated = db.updateAppointment(id, updates);

    // Update queue ticket if exists
    const ticket = db.findQueueTicketByAppointmentId(id);
    if (ticket && status === 'COMPLETED') {
      db.updateQueueTicket(ticket.id, { status: 'COMPLETED', completedTime: new Date().toISOString() });
    } else if (ticket && status === 'CANCELLED') {
      db.updateQueueTicket(ticket.id, { status: 'CANCELLED' });
    }

    const patient = db.findPatientProfileById(apt.patientId);
    if (patient) {
      createNotification(
        patient.userId,
        'Appointment Status Updated',
        `Your appointment ${apt.appointmentNumber} status is now: ${status}.`,
        'APPOINTMENT',
        '/patient/appointments'
      );
    }

    return res.json({ success: true, message: 'Status updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update status: ' + error.message });
  }
}
