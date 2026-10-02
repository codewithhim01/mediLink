import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Referral, ReferralPriority } from '../types/index.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

export async function getReferrals(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const allReferrals = db.getReferrals();
    const allDoctors = db.getDoctorProfiles();
    const allPatients = db.getPatientProfiles();
    const allUsers = db.getUsers();
    const allLabs = db.getLaboratories();
    const allTests = db.getDiagnosticTests();

    let list = allReferrals;

    if (req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (!patient) return res.json({ success: true, data: [] });
      list = list.filter(r => r.patientId === patient.id);
    } else if (req.user.role === 'DOCTOR') {
      const doc = db.findDoctorProfileByUserId(req.user.userId);
      if (!doc) return res.json({ success: true, data: [] });
      list = list.filter(r => r.doctorId === doc.id);
    } else if (req.user.role === 'LABORATORY') {
      const lab = db.findLaboratoryByUserId(req.user.userId);
      if (!lab) return res.json({ success: true, data: [] });
      list = list.filter(r => r.labId === lab.id);
    }

    const enriched = list.map(ref => {
      const docProf = allDoctors.find(d => d.id === ref.doctorId);
      const docUser = docProf ? allUsers.find(u => u.id === docProf.userId) : null;
      const patientProf = allPatients.find(p => p.id === ref.patientId);
      const patientUser = patientProf ? allUsers.find(u => u.id === patientProf.userId) : null;
      const lab = allLabs.find(l => l.id === ref.labId);
      const test = allTests.find(t => t.id === ref.testId);

      return {
        ...ref,
        doctorName: docUser ? docUser.name : 'Referring Doctor',
        doctorSpecialty: docProf?.specialty,
        patientName: patientUser ? patientUser.name : 'Patient',
        patientEmail: patientUser?.email,
        labName: lab ? lab.name : 'Open Partner Laboratory',
        testName: test ? test.name : 'Recommended Diagnostic Panel',
        testCategory: test?.category,
        testPrice: test ? (test.discountPrice || test.price) : undefined
      };
    });

    enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve referrals: ' + error.message });
  }
}

export async function createReferral(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, error: 'Only doctors can issue diagnostic referrals.' });
    }

    const doc = db.findDoctorProfileByUserId(req.user.userId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found.' });
    }

    const { patientId, labId, testId, notes, priority } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient is required.' });
    }

    const patient = db.findPatientProfileById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    const now = new Date().toISOString();
    const refCode = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReferral: Referral = {
      id: `ref-${Date.now()}`,
      referralCode: refCode,
      doctorId: doc.id,
      patientId: patient.id,
      labId: labId || null,
      testId: testId || null,
      notes: notes || 'Clinical correlation recommended.',
      priority: priority === 'URGENT' ? 'URGENT' : 'NORMAL',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    db.addReferral(newReferral);

    createNotification(
      patient.userId,
      'New Diagnostic Referral Issued',
      `Dr. ${req.user.name} has issued diagnostic referral ${refCode}. Click to review and book online.`,
      'BOOKING',
      '/patient/referrals'
    );

    logAudit(req.user.userId, 'REFERRAL_CREATED', 'REFERRAL', newReferral.id, {
      referralCode: refCode,
      patientId: patient.id,
      testId
    });

    return res.status(201).json({ success: true, message: 'Referral created', data: newReferral });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create referral: ' + error.message });
  }
}
