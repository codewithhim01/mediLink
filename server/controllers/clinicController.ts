import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getClinics(req: Request, res: Response) {
  try {
    const { city, search } = req.query;
    let list = db.getClinics().map(c => {
      let services = [];
      let facilities = [];
      try { services = JSON.parse(c.servicesJson); } catch {}
      try { facilities = JSON.parse(c.facilitiesJson); } catch {}
      return {
        ...c,
        services,
        facilities
      };
    });

    if (city) {
      const cityStr = String(city).toLowerCase();
      list = list.filter(c => c.city.toLowerCase().includes(cityStr));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
    }

    return res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve clinics: ' + error.message });
  }
}

export async function getClinicById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const clinic = db.findClinicById(id);
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found.' });
    }

    let services = [];
    let facilities = [];
    try { services = JSON.parse(clinic.servicesJson); } catch {}
    try { facilities = JSON.parse(clinic.facilitiesJson); } catch {}

    // Doctors associated with this clinic
    const allDocs = db.getDoctorProfiles().filter(d => d.clinicId === clinic.id);
    const allUsers = db.getUsers();
    const doctors = allDocs.map(d => {
      const u = allUsers.find(user => user.id === d.userId);
      return {
        id: d.id,
        name: u?.name || 'Dr. Specialist',
        specialty: d.specialty,
        fee: d.consultationFee,
        rating: d.rating,
        reviewCount: d.reviewCount
      };
    });

    return res.json({
      success: true,
      data: {
        ...clinic,
        services,
        facilities,
        doctors
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve clinic: ' + error.message });
  }
}

export async function updateClinicProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'CLINIC') {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const clinic = db.findClinicByUserId(req.user.userId);
    if (!clinic) {
      return res.status(404).json({ success: false, error: 'Clinic not found.' });
    }

    const { name, address, city, phone, email, services, facilities, openingTime, closingTime } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (openingTime !== undefined) updates.openingTime = openingTime;
    if (closingTime !== undefined) updates.closingTime = closingTime;
    if (services !== undefined) updates.servicesJson = JSON.stringify(services);
    if (facilities !== undefined) updates.facilitiesJson = JSON.stringify(facilities);

    const updated = db.updateClinic(clinic.id, updates);
    return res.json({ success: true, message: 'Clinic updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update clinic: ' + error.message });
  }
}
