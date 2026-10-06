import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { User, Role } from '../types/index.js';

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
      adminRole: u.adminRole || (u.id === 'usr-admin-1' ? 'PRIMARY' : (u.role === 'ADMIN' ? 'CO_ADMIN' : undefined)),
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

export async function deleteUserByAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const targetUser = db.findUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (targetUser.id === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Administrators cannot delete their own active account from the admin console.'
      });
    }

    if (targetUser.role === 'ADMIN') {
      const adminCount = db.getUsers().filter(u => u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'The only remaining system administrator account cannot be deleted.'
        });
      }
    }

    const result = db.deleteUser(id);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete user account.'
      });
    }

    logAudit(req.user?.userId, 'ADMIN_DELETED_USER_ACCOUNT', 'USER', id, {
      deletedEmail: targetUser.email,
      deletedName: targetUser.name,
      deletedRole: targetUser.role
    });

    return res.json({
      success: true,
      message: `User account for ${targetUser.name} (${targetUser.email}) and all associated records have been permanently deleted.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete user: ' + error.message });
  }
}

export async function updateAdminProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const currentAdmin = db.findUserById(adminId);
    if (!currentAdmin) return res.status(404).json({ success: false, error: 'Admin account not found.' });

    const { name, email, phone, avatarUrl, newPassword, currentPassword } = req.body;
    const updates: Partial<User> = {};

    if (name && typeof name === 'string') {
      if (name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Full name must be at least 2 characters.' });
      }
      updates.name = name.trim();
    }

    if (email && typeof email === 'string') {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== currentAdmin.email.toLowerCase()) {
        const existing = db.findUserByEmail(normalizedEmail);
        if (existing) {
          return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
        }
        updates.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }

    if (avatarUrl && typeof avatarUrl === 'string') {
      updates.avatarUrl = avatarUrl.trim();
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
      }

      if (currentPassword) {
        const match = bcrypt.compareSync(currentPassword, currentAdmin.passwordHash);
        if (!match) {
          return res.status(400).json({ success: false, error: 'Current password does not match.' });
        }
      }

      updates.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    const updatedUser = db.updateUser(adminId, updates);

    logAudit(adminId, 'ADMIN_PROFILE_MODIFIED', 'USER', adminId, {
      name: updatedUser?.name,
      email: updatedUser?.email,
      phone: updatedUser?.phone
    });

    return res.json({
      success: true,
      message: 'Administrator details updated successfully.',
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        phone: updatedUser?.phone,
        avatarUrl: updatedUser?.avatarUrl,
        status: updatedUser?.status
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update admin profile: ' + error.message });
  }
}

export async function createAdminAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const creatorId = req.user?.userId;
    if (!creatorId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const { name, email, password, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Admin full name must be at least 2 characters.' });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    const newAdminId = `usr-admin-${Date.now()}`;
    const now = new Date().toISOString();

    const newAdmin: User = {
      id: newAdminId,
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      name: name.trim(),
      role: 'ADMIN',
      phone: phone ? String(phone).trim() : '+91 522 220 9000',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      status: 'VERIFIED',
      createdAt: now,
      updatedAt: now
    };

    db.addUser(newAdmin);

    logAudit(creatorId, 'NEW_ADMIN_CREATED', 'USER', newAdmin.id, {
      createdByAdminId: creatorId,
      newAdminEmail: normalizedEmail,
      newAdminName: name.trim()
    });

    createNotification(
      newAdmin.id,
      'Welcome to MediLink Administration',
      'Your administrator account has been provisioned with full platform authority.',
      'SYSTEM',
      '/admin/dashboard'
    );

    return res.status(201).json({
      success: true,
      message: `Administrator account for ${newAdmin.name} (${newAdmin.email}) created successfully.`,
      data: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        phone: newAdmin.phone,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create admin account: ' + error.message });
  }
}

export async function appointCoAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const requesterId = req.user?.userId;
    if (!requesterId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const requester = db.findUserById(requesterId);
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only platform administrators can appoint co-administrators.' });
    }

    const { userId, name, email, password, phone } = req.body;

    if (userId) {
      const targetUser = db.findUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target user not found.' });
      }

      if (targetUser.id === 'usr-admin-1' || targetUser.adminRole === 'PRIMARY') {
        return res.status(400).json({ success: false, error: 'User is already the Primary Platform Administrator.' });
      }

      if (targetUser.role === 'ADMIN' && targetUser.adminRole === 'CO_ADMIN') {
        return res.status(400).json({ success: false, error: 'User is already appointed as a Co-Administrator.' });
      }

      const prevRole = targetUser.role;
      db.updateUser(targetUser.id, {
        role: 'ADMIN',
        adminRole: 'CO_ADMIN',
        status: 'VERIFIED'
      });

      logAudit(requesterId, 'CO_ADMIN_APPOINTED', 'USER', targetUser.id, {
        appointedBy: requester.name,
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        previousRole: prevRole
      });

      createNotification(
        targetUser.id,
        'Appointed as MediLink Co-Administrator',
        `You have been appointed as Co-Administrator by ${requester.name}. You now have access to administrator controls and executive dashboard.`,
        'SYSTEM',
        '/admin/dashboard'
      );

      return res.json({
        success: true,
        message: `${targetUser.name} (${targetUser.email}) has been successfully appointed as Co-Administrator.`
      });
    } else if (name && email && password) {
      if (name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Full legal name must be at least 2 characters.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (db.findUserByEmail(normalizedEmail)) {
        return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      }

      const newId = `usr-coadmin-${Date.now()}`;
      const now = new Date().toISOString();
      const newCoAdmin: User = {
        id: newId,
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(password, 10),
        name: name.trim(),
        role: 'ADMIN',
        adminRole: 'CO_ADMIN',
        phone: phone ? String(phone).trim() : '+91 522 220 9000',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        status: 'VERIFIED',
        createdAt: now,
        updatedAt: now
      };

      db.addUser(newCoAdmin);

      logAudit(requesterId, 'NEW_CO_ADMIN_CREATED', 'USER', newId, {
        appointedBy: requester.name,
        coAdminEmail: normalizedEmail,
        coAdminName: name.trim()
      });

      createNotification(
        newId,
        'Welcome to MediLink Administration',
        `Your Co-Administrator account has been provisioned by ${requester.name}.`,
        'SYSTEM',
        '/admin/dashboard'
      );

      return res.status(201).json({
        success: true,
        message: `Co-Administrator account for ${newCoAdmin.name} (${newCoAdmin.email}) created and appointed successfully.`,
        data: {
          id: newCoAdmin.id,
          name: newCoAdmin.name,
          email: newCoAdmin.email,
          role: newCoAdmin.role,
          adminRole: 'CO_ADMIN'
        }
      });
    } else {
      return res.status(400).json({ success: false, error: 'Please specify an existing user to appoint or fill out name, email, and password.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to appoint co-administrator: ' + error.message });
  }
}

export async function removeCoAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const requesterId = req.user?.userId;
    if (!requesterId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const requester = db.findUserById(requesterId);
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only administrators can remove co-administrators.' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Target user ID is required.' });
    }

    if (userId === requesterId) {
      return res.status(400).json({ success: false, error: 'You cannot remove your own administrative authority.' });
    }

    const targetUser = db.findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }

    if (targetUser.id === 'usr-admin-1' || targetUser.adminRole === 'PRIMARY') {
      return res.status(400).json({ success: false, error: 'The Primary Platform Administrator cannot be removed or demoted.' });
    }

    if (targetUser.role !== 'ADMIN' && targetUser.adminRole !== 'CO_ADMIN') {
      return res.status(400).json({ success: false, error: 'User is not currently a co-administrator.' });
    }

    // Check if target user has an original role profile
    let revertedRole: Role = 'PATIENT';
    if (db.findDoctorProfileByUserId(targetUser.id)) {
      revertedRole = 'DOCTOR';
    } else if (db.findClinicByUserId(targetUser.id)) {
      revertedRole = 'CLINIC';
    } else if (db.findLaboratoryByUserId(targetUser.id)) {
      revertedRole = 'LABORATORY';
    }

    db.updateUser(targetUser.id, {
      role: revertedRole,
      adminRole: undefined
    });

    logAudit(requesterId, 'CO_ADMIN_REMOVED', 'USER', targetUser.id, {
      removedBy: requester.name,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      revertedRole
    });

    createNotification(
      targetUser.id,
      'Co-Administrator Privileges Revoked',
      `Your Co-Administrator privileges have been revoked by ${requester.name}. Your role is now set to ${revertedRole}.`,
      'SYSTEM',
      '/'
    );

    return res.json({
      success: true,
      message: `Co-Administrator privileges for ${targetUser.name} (${targetUser.email}) have been removed. Role adjusted to ${revertedRole}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to remove co-administrator: ' + error.message });
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
