import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Review, TargetType } from '../types/index.js';

export async function getReviews(req: Request, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    const allReviews = db.getReviews().filter(r => r.targetType === targetType.toUpperCase() && r.targetId === targetId);
    const allPatients = db.getPatientProfiles();
    const allUsers = db.getUsers();

    const enriched = allReviews.map(rev => {
      const p = allPatients.find(patient => patient.id === rev.patientId);
      const u = p ? allUsers.find(user => user.id === p.userId) : null;
      return {
        ...rev,
        patientName: u ? u.name : 'Verified Patient'
      };
    });

    enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve reviews: ' + error.message });
  }
}

export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, error: 'Only patients can submit reviews.' });
    }

    const patient = db.findPatientProfileByUserId(req.user.userId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found.' });
    }

    const { targetType, targetId, rating, comment } = req.body;
    if (!targetType || !targetId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Target, rating (1-5), and comment are required.' });
    }

    const numRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      patientId: patient.id,
      targetType: targetType.toUpperCase() as TargetType,
      targetId,
      rating: numRating,
      comment,
      isVerifiedVisit: true,
      createdAt: new Date().toISOString()
    };

    db.addReview(newReview);

    // Update target rating & review count
    if (newReview.targetType === 'DOCTOR') {
      const doc = db.findDoctorProfileById(targetId);
      if (doc) {
        const docReviews = db.getReviews().filter(r => r.targetType === 'DOCTOR' && r.targetId === targetId);
        const avg = docReviews.reduce((sum, r) => sum + r.rating, 0) / docReviews.length;
        db.updateDoctorProfile(doc.id, { rating: Number(avg.toFixed(1)), reviewCount: docReviews.length });
      }
    } else if (newReview.targetType === 'LABORATORY') {
      const lab = db.findLaboratoryById(targetId);
      if (lab) {
        const labReviews = db.getReviews().filter(r => r.targetType === 'LABORATORY' && r.targetId === targetId);
        const avg = labReviews.reduce((sum, r) => sum + r.rating, 0) / labReviews.length;
        db.updateLaboratory(lab.id, { rating: Number(avg.toFixed(1)), reviewCount: labReviews.length });
      }
    } else if (newReview.targetType === 'CLINIC') {
      const clinic = db.findClinicById(targetId);
      if (clinic) {
        const clinicReviews = db.getReviews().filter(r => r.targetType === 'CLINIC' && r.targetId === targetId);
        const avg = clinicReviews.reduce((sum, r) => sum + r.rating, 0) / clinicReviews.length;
        db.updateClinic(clinic.id, { rating: Number(avg.toFixed(1)), reviewCount: clinicReviews.length });
      }
    }

    return res.status(201).json({ success: true, message: 'Review submitted', data: newReview });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to create review: ' + error.message });
  }
}
