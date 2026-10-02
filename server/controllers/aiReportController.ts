import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { aiReportService } from '../services/aiReportService.js';
import { logAudit } from '../services/auditService.js';
import { db } from '../db/store.js';
import { MedicalReport } from '../types/index.js';

export async function analyzeReport(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { reportText, fileName, saveAsReport } = req.body;

    if (!reportText || typeof reportText !== 'string' || reportText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid medical report text or extracted content to analyze.'
      });
    }

    // Size limit check (max 200,000 characters for safety)
    if (reportText.length > 200000) {
      return res.status(413).json({
        success: false,
        error: 'Report file content exceeds maximum analysis length (200KB).'
      });
    }

    const sanitizedFileName = fileName || 'Uploaded_Medical_Report.pdf';

    logAudit(req.user.userId, 'AI_REPORT_ANALYSIS_REQUESTED', 'AI_ASSISTANT', undefined, {
      fileName: sanitizedFileName,
      contentLength: reportText.length
    });

    // Run AI extraction and provider adapter with MediLink doctor & lab matching
    const analysisResult = await aiReportService.analyzeReport(reportText, sanitizedFileName);

    let savedReportRecord = null;

    // If patient requested to save this analyzed report into their personal medical records
    if (saveAsReport && req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (patient) {
        const now = new Date().toISOString();
        const primaryTestName = analysisResult.testNames[0] || 'Previous Diagnostic Investigation';
        const newReport: MedicalReport = {
          id: `rep-ai-${Date.now()}`,
          patientId: patient.id,
          reportTitle: `${primaryTestName} (External Upload)`,
          testCategory: analysisResult.interpretation.relevantSpecialties[0] || 'General Diagnostics',
          fileUrl: '/uploads/patient_uploaded_report.pdf',
          fileName: sanitizedFileName,
          fileSize: reportText.length,
          mimeType: 'application/pdf',
          summary: analysisResult.interpretation.plainLanguageSummary,
          extractedFactsJson: JSON.stringify(analysisResult.extractedFacts),
          aiAnalysisJson: JSON.stringify(analysisResult.interpretation),
          status: 'PUBLISHED',
          publishedAt: now,
          isSharedWithDoctor: true,
          createdAt: now,
          updatedAt: now,
        };
        db.addMedicalReport(newReport);
        savedReportRecord = newReport;
      }
    }

    return res.json({
      success: true,
      data: {
        analysis: analysisResult,
        savedReport: savedReportRecord
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process medical report analysis: ' + error.message
    });
  }
}
