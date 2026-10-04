import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export async function getAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const users = db.getUsers();
    const doctors = db.getDoctorProfiles();
    const clinics = db.getClinics();
    const labs = db.getLaboratories();
    const tests = db.getDiagnosticTests();
    const appointments = db.getAppointments();
    const bookings = db.getTestBookings();
    const reports = db.getMedicalReports();
    const queues = db.getQueues();
    const auditLogs = db.getAuditLogs();

    const verifiedDoctors = doctors.filter(d => d.isVerified).length;
    const pendingDoctors = doctors.filter(d => !d.isVerified).length;
    const verifiedLabs = labs.filter(l => l.isVerified).length;
    const pendingLabs = labs.filter(l => !l.isVerified).length;

    const totalRevenueVolume = appointments.reduce((sum, a) => sum + (a.feePaid || 0), 0) +
                               bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return res.json({
      success: true,
      data: {
        totalUsers: users.length,
        usersByRole: {
          patients: users.filter(u => u.role === 'PATIENT').length,
          doctors: doctors.length,
          clinics: clinics.length,
          laboratories: labs.length,
          admins: users.filter(u => u.role === 'ADMIN').length
        },
        providers: {
          verifiedDoctors,
          pendingDoctors,
          verifiedLabs,
          pendingLabs,
          verifiedClinics: clinics.filter(c => c.isVerified).length
        },
        activity: {
          totalAppointments: appointments.length,
          activeAppointments: appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length,
          completedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
          totalTestBookings: bookings.length,
          totalReportsPublished: reports.length,
          activeQueues: queues.filter(q => q.status === 'ACTIVE').length
        },
        financialVolume: {
          totalTransactions: totalRevenueVolume,
          currency: 'USD'
        },
        recentAuditLogsCount: auditLogs.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve admin stats: ' + error.message });
  }
}

export async function getVerifications(req: AuthenticatedRequest, res: Response) {
  try {
    const allUsers = db.getUsers();
    const doctors = db.getDoctorProfiles();
    const clinics = db.getClinics();
    const labs = db.getLaboratories();

    const pendingList: any[] = [];

    doctors.forEach(doc => {
      const u = allUsers.find(user => user.id === doc.userId);
      pendingList.push({
        id: doc.id,
        userId: doc.userId,
        entityType: 'DOCTOR',
        name: u ? u.name : 'Doctor',
        email: u?.email,
        phone: u?.phone,
        credentialIdentifier: `License #${doc.licenseNumber}`,
        qualification: doc.qualification,
        specialty: doc.specialty,
        isVerified: doc.isVerified,
        status: u?.status,
        submittedAt: doc.createdAt
      });
    });

    clinics.forEach(clinic => {
      const u = allUsers.find(user => user.id === clinic.userId);
      pendingList.push({
        id: clinic.id,
        userId: clinic.userId,
        entityType: 'CLINIC',
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone,
        credentialIdentifier: `Registration #${clinic.registrationNo}`,
        qualification: 'Facility Registration & Health Permit',
        specialty: clinic.city,
        isVerified: clinic.isVerified,
        status: u?.status,
        submittedAt: clinic.createdAt
      });
    });

    labs.forEach(lab => {
      const u = allUsers.find(user => user.id === lab.userId);
      pendingList.push({
        id: lab.id,
        userId: lab.userId,
        entityType: 'LABORATORY',
        name: lab.name,
        email: lab.email,
        phone: lab.phone,
        credentialIdentifier: `NABL / ICMR Reg. #${lab.licenseNo}`,
        qualification: lab.accreditation || 'NABL Accredited Pathology Lab',
        specialty: lab.city,
        isVerified: lab.isVerified,
        status: u?.status,
        submittedAt: lab.createdAt
      });
    });

    return res.json({ success: true, count: pendingList.length, data: pendingList });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve verifications: ' + error.message });
  }
}

export async function updateVerificationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { entityType, id } = req.params;
    const { isVerified, statusNote } = req.body;

    const approved = Boolean(isVerified);

    let targetUserId = '';
    if (entityType.toUpperCase() === 'DOCTOR') {
      const doc = db.findDoctorProfileById(id);
      if (!doc) return res.status(404).json({ success: false, error: 'Doctor not found.' });
      db.updateDoctorProfile(doc.id, { isVerified: approved });
      db.updateUser(doc.userId, { status: approved ? 'VERIFIED' : 'REJECTED' });
      targetUserId = doc.userId;
    } else if (entityType.toUpperCase() === 'LABORATORY') {
      const lab = db.findLaboratoryById(id);
      if (!lab) return res.status(404).json({ success: false, error: 'Laboratory not found.' });
      db.updateLaboratory(lab.id, { isVerified: approved });
      db.updateUser(lab.userId, { status: approved ? 'VERIFIED' : 'REJECTED' });
      targetUserId = lab.userId;
    } else if (entityType.toUpperCase() === 'CLINIC') {
      const clinic = db.findClinicById(id);
      if (!clinic) return res.status(404).json({ success: false, error: 'Clinic not found.' });
      db.updateClinic(clinic.id, { isVerified: approved });
      db.updateUser(clinic.userId, { status: approved ? 'VERIFIED' : 'REJECTED' });
      targetUserId = clinic.userId;
    }

    if (targetUserId) {
      createNotification(
        targetUserId,
        approved ? 'Credential Verification Approved' : 'Verification Rejected',
        approved
          ? 'Your professional credentials have been validated by MediLink Administration. Your profile is now live for patient bookings.'
          : `Your verification request was rejected. Note: ${statusNote || 'Please update license documents.'}`,
        'VERIFICATION',
        '/'
      );
    }

    logAudit(req.user?.userId, 'PROVIDER_VERIFICATION_DECIDED', entityType.toUpperCase(), id, {
      approved,
      statusNote
    });

    return res.json({ success: true, message: `Verification status updated to ${approved ? 'VERIFIED' : 'REJECTED'}.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update verification: ' + error.message });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      status: u.status,
      createdAt: u.createdAt
    }));

    return res.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve users: ' + error.message });
  }
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = db.findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const updated = db.updateUser(id, { status });
    logAudit(req.user?.userId, 'USER_STATUS_ALTERED', 'USER', id, { newStatus: status });

    return res.json({ success: true, message: 'User status updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update user: ' + error.message });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = [...db.getAuditLogs()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs: ' + error.message });
  }
}

export async function resetDemoData(req: AuthenticatedRequest, res: Response) {
  try {
    db.resetToSeed();
    logAudit(req.user?.userId, 'DEMO_DATA_RESET', 'PLATFORM', 'SYSTEM');
    return res.json({ success: true, message: 'MediLink demo database reset to clean initial seed data.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to reset demo: ' + error.message });
  }
}
