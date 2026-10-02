import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MedicalReport } from '../types/index.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export async function getReports(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const allReports = db.getMedicalReports();
    const allLabs = db.getLaboratories();
    const allDoctors = db.getDoctorProfiles();
    const allPatients = db.getPatientProfiles();
    const allUsers = db.getUsers();

    let list: MedicalReport[] = [];

    if (req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (!patient) return res.json({ success: true, data: [] });
      list = allReports.filter(r => r.patientId === patient.id);
    } else if (req.user.role === 'DOCTOR') {
      const doc = db.findDoctorProfileByUserId(req.user.userId);
      if (!doc) return res.json({ success: true, data: [] });
      // Doctor can see reports where docId is matched OR where patient shared reports
      list = allReports.filter(r => r.doctorId === doc.id || r.isSharedWithDoctor);
    } else if (req.user.role === 'LABORATORY') {
      const lab = db.findLaboratoryByUserId(req.user.userId);
      if (!lab) return res.json({ success: true, data: [] });
      list = allReports.filter(r => r.labId === lab.id);
    } else if (req.user.role === 'ADMIN') {
      list = allReports;
    }

    const enriched = list.map(rep => {
      const lab = allLabs.find(l => l.id === rep.labId);
      const doc = allDoctors.find(d => d.id === rep.doctorId);
      const docUser = doc ? allUsers.find(u => u.id === doc.userId) : null;
      const patientProf = allPatients.find(p => p.id === rep.patientId);
      const patientUser = patientProf ? allUsers.find(u => u.id === patientProf.userId) : null;

      let extractedFacts = [];
      let aiAnalysis = null;
      try { extractedFacts = JSON.parse(rep.extractedFactsJson || '[]'); } catch {}
      try { aiAnalysis = JSON.parse(rep.aiAnalysisJson || '{}'); } catch {}

      return {
        ...rep,
        laboratoryName: lab ? lab.name : 'Authorized Diagnostics',
        doctorName: docUser ? docUser.name : 'Attending Physician',
        patientName: patientUser ? patientUser.name : 'Patient',
        extractedFacts,
        aiAnalysis
      };
    });

    enriched.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve reports: ' + error.message });
  }
}

export async function getReportById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const report = db.findMedicalReportById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Medical report not found.' });
    }

    // Security & Authorization Check
    let isAuthorized = false;
    if (req.user.role === 'ADMIN') {
      isAuthorized = true;
    } else if (req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (patient && patient.id === report.patientId) isAuthorized = true;
    } else if (req.user.role === 'DOCTOR') {
      const doc = db.findDoctorProfileByUserId(req.user.userId);
      if (doc && (doc.id === report.doctorId || report.isSharedWithDoctor)) isAuthorized = true;
    } else if (req.user.role === 'LABORATORY') {
      const lab = db.findLaboratoryByUserId(req.user.userId);
      if (lab && lab.id === report.labId) isAuthorized = true;
    }

    if (!isAuthorized) {
      logAudit(req.user.userId, 'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT', 'MEDICAL_REPORT', id, { role: req.user.role });
      return res.status(403).json({ success: false, error: 'Access forbidden. You are not authorized to view this patient medical report.' });
    }

    logAudit(req.user.userId, 'REPORT_ACCESSED', 'MEDICAL_REPORT', id, { reportTitle: report.reportTitle });

    let extractedFacts = [];
    let aiAnalysis = null;
    try { extractedFacts = JSON.parse(report.extractedFactsJson || '[]'); } catch {}
    try { aiAnalysis = JSON.parse(report.aiAnalysisJson || '{}'); } catch {}

    const lab = db.findLaboratoryById(report.labId || '');
    const patientProf = db.findPatientProfileById(report.patientId);
    const patientUser = patientProf ? db.findUserById(patientProf.userId) : null;

    return res.json({
      success: true,
      data: {
        ...report,
        laboratoryName: lab?.name,
        patientName: patientUser?.name,
        extractedFacts,
        aiAnalysis
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve report: ' + error.message });
  }
}

export async function uploadLabReport(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'LABORATORY') {
      return res.status(403).json({ success: false, error: 'Only registered laboratories can upload official reports.' });
    }

    const lab = db.findLaboratoryByUserId(req.user.userId);
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Laboratory profile not found.' });
    }

    const { testBookingId, patientId, reportTitle, testCategory, summary, extractedFacts } = req.body;
    if (!patientId || !reportTitle) {
      return res.status(400).json({ success: false, error: 'Patient and Report Title are required.' });
    }

    const patient = db.findPatientProfileById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    const now = new Date().toISOString();
    const newReport: MedicalReport = {
      id: `rep-${Date.now()}`,
      testBookingId: testBookingId || undefined,
      patientId: patient.id,
      labId: lab.id,
      doctorId: undefined,
      reportTitle,
      testCategory: testCategory || 'Clinical Pathology',
      fileUrl: '/uploads/official_lab_report.pdf',
      fileName: `${reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      fileSize: 184500,
      mimeType: 'application/pdf',
      summary: summary || 'Routine clinical investigation completed. Parameters validated by laboratory director.',
      extractedFactsJson: JSON.stringify(extractedFacts || []),
      aiAnalysisJson: '{}',
      status: 'PUBLISHED',
      publishedAt: now,
      isSharedWithDoctor: true,
      createdAt: now,
      updatedAt: now,
    };

    db.addMedicalReport(newReport);

    // If test booking exists, update status to REPORT_READY
    if (testBookingId) {
      db.updateTestBooking(testBookingId, { status: 'REPORT_READY' });
      const sample = db.findSampleByBookingId(testBookingId);
      if (sample) {
        db.updateSample(sample.id, { status: 'COMPLETED' });
      }
    }

    createNotification(
      patient.userId,
      'Medical Diagnostic Report Ready',
      `Your report "${reportTitle}" has been validated and published by ${lab.name}.`,
      'REPORT',
      '/patient/reports'
    );

    logAudit(req.user.userId, 'REPORT_PUBLISHED', 'MEDICAL_REPORT', newReport.id, {
      reportTitle,
      patientId: patient.id
    });

    return res.status(201).json({ success: true, message: 'Report published successfully', data: newReport });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to upload report: ' + error.message });
  }
}

export async function toggleShareReport(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, error: 'Only patient can toggle report sharing permissions.' });
    }

    const { id } = req.params;
    const { isSharedWithDoctor } = req.body;

    const patient = db.findPatientProfileByUserId(req.user.userId);
    const report = db.findMedicalReportById(id);

    if (!report || !patient || report.patientId !== patient.id) {
      return res.status(404).json({ success: false, error: 'Report not found or not owned by patient.' });
    }

    const updated = db.updateMedicalReport(id, { isSharedWithDoctor: Boolean(isSharedWithDoctor) });
    return res.json({ success: true, message: 'Sharing permission updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update sharing: ' + error.message });
  }
}
