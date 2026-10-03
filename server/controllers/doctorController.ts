import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getDoctors(req: Request, res: Response) {
  try {
    const { specialty, city, maxFee, minRating, search } = req.query;

    const allDoctors = db.getDoctorProfiles();
    const allUsers = db.getUsers();
    const allClinics = db.getClinics();

    let filtered = allDoctors.map(doc => {
      const user = allUsers.find(u => u.id === doc.userId);
      const clinic = allClinics.find(c => c.id === doc.clinicId);
      let availability: string[] = [];
      try {
        availability = JSON.parse(doc.availabilityJson);
      } catch {
        availability = ['Mon - Fri'];
      }

      return {
        id: doc.id,
        userId: doc.userId,
        name: user ? user.name : 'Unknown Doctor',
        email: user ? user.email : '',
        phone: user ? user.phone : '',
        avatarUrl: user?.avatarUrl,
        specialty: doc.specialty,
        subSpecialty: doc.subSpecialty,
        experienceYears: doc.experienceYears,
        qualification: doc.qualification,
        licenseNumber: doc.licenseNumber,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        consultationDuration: doc.consultationDuration,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        isVerified: doc.isVerified,
        clinicId: doc.clinicId,
        clinicName: clinic ? clinic.name : 'Independent Specialist',
        clinicAddress: clinic ? clinic.address : 'Gomti Nagar, Lucknow, UP',
        clinicCity: clinic ? clinic.city : 'Lucknow',
        area: doc.area || clinic?.area || 'Gomti Nagar & Vibhuti Khand',
        latitude: doc.latitude || clinic?.latitude || 26.8500,
        longitude: doc.longitude || clinic?.longitude || 80.9990,
        availability,
      };
    });

    const { area } = req.query;
    if (area) {
      const areaStr = String(area).toLowerCase();
      filtered = filtered.filter(d => d.area.toLowerCase().includes(areaStr));
    }

    if (specialty) {
      const specStr = String(specialty).toLowerCase();
      filtered = filtered.filter(d => d.specialty.toLowerCase().includes(specStr) || (d.subSpecialty && d.subSpecialty.toLowerCase().includes(specStr)));
    }

    if (city) {
      const cityStr = String(city).toLowerCase();
      filtered = filtered.filter(d => d.clinicCity.toLowerCase().includes(cityStr));
    }

    if (maxFee) {
      const feeNum = parseFloat(String(maxFee));
      if (!isNaN(feeNum)) {
        filtered = filtered.filter(d => d.consultationFee <= feeNum);
      }
    }

    if (minRating) {
      const ratingNum = parseFloat(String(minRating));
      if (!isNaN(ratingNum)) {
        filtered = filtered.filter(d => d.rating >= ratingNum);
      }
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q) ||
        (d.bio && d.bio.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve doctors: ' + error.message });
  }
}

export async function getDoctorById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const doc = db.findDoctorProfileById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    const user = db.findUserById(doc.userId);
    const clinic = allClinics().find(c => c.id === doc.clinicId);
    const reviews = db.getReviews().filter(r => r.targetType === 'DOCTOR' && r.targetId === doc.id);

    let availability: string[] = [];
    try {
      availability = JSON.parse(doc.availabilityJson);
    } catch {
      availability = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }

    return res.json({
      success: true,
      data: {
        id: doc.id,
        userId: doc.userId,
        name: user ? user.name : 'Unknown Doctor',
        email: user ? user.email : '',
        phone: user ? user.phone : '',
        avatarUrl: user?.avatarUrl,
        specialty: doc.specialty,
        subSpecialty: doc.subSpecialty,
        experienceYears: doc.experienceYears,
        qualification: doc.qualification,
        licenseNumber: doc.licenseNumber,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        consultationDuration: doc.consultationDuration,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        isVerified: doc.isVerified,
        area: doc.area || clinic?.area || 'Gomti Nagar & Vibhuti Khand',
        latitude: doc.latitude || clinic?.latitude || 26.8500,
        longitude: doc.longitude || clinic?.longitude || 80.9990,
        clinic,
        availability,
        reviews
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch doctor: ' + error.message });
  }
}

export async function updateDoctorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'DOCTOR') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const doc = db.findDoctorProfileByUserId(req.user.userId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found.' });
    }

    const { specialty, subSpecialty, experienceYears, qualification, consultationFee, bio, consultationDuration, availability } = req.body;

    const updates: any = {};
    if (specialty !== undefined) updates.specialty = specialty;
    if (subSpecialty !== undefined) updates.subSpecialty = subSpecialty;
    if (experienceYears !== undefined) updates.experienceYears = Number(experienceYears);
    if (qualification !== undefined) updates.qualification = qualification;
    if (consultationFee !== undefined) updates.consultationFee = Number(consultationFee);
    if (bio !== undefined) updates.bio = bio;
    if (consultationDuration !== undefined) updates.consultationDuration = Number(consultationDuration);
    if (availability !== undefined) updates.availabilityJson = JSON.stringify(availability);

    const updated = db.updateDoctorProfile(doc.id, updates);
    return res.json({ success: true, message: 'Doctor profile updated', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update profile: ' + error.message });
  }
}

function allClinics() {
  return db.getClinics();
}
