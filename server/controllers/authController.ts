import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/store.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Role, User } from '../types/index.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['PATIENT', 'DOCTOR', 'CLINIC', 'LABORATORY', 'ADMIN'] as const),
  phone: z.string().optional(),
  // Extra role fields
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.number().optional(),
  clinicName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  registrationNo: z.string().optional(),
  labName: z.string().optional(),
  licenseNo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten()
      });
    }

    const {
      email,
      password,
      name,
      role,
      phone,
      specialty,
      qualification,
      licenseNumber,
      consultationFee,
      clinicName,
      address,
      city,
      registrationNo,
      labName,
      licenseNo
    } = parseResult.data;

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = `usr-${role.toLowerCase().slice(0, 3)}-${Date.now()}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email,
      passwordHash,
      name,
      role: role as Role,
      phone: phone || '',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      status: role === 'PATIENT' || role === 'ADMIN' ? 'VERIFIED' : 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    db.addUser(newUser);

    // Auto-create role-specific profile
    if (role === 'PATIENT') {
      db.addPatientProfile({
        id: `pat-prof-${Date.now()}`,
        userId,
        dob: '1995-01-01',
        gender: 'Not Specified',
        address: address || 'City Center',
        medicalHistoryJson: '[]',
        createdAt: now,
        updatedAt: now,
      });
    } else if (role === 'DOCTOR') {
      db.addDoctorProfile({
        id: `doc-prof-${Date.now()}`,
        userId,
        specialty: specialty || 'General Medicine',
        experienceYears: 5,
        qualification: qualification || 'MD',
        licenseNumber: licenseNumber || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        consultationFee: consultationFee || 80,
        bio: 'Dedicated healthcare practitioner committed to patient wellbeing.',
        consultationDuration: 20,
        rating: 5.0,
        reviewCount: 0,
        clinicId: 'cln-1',
        isVerified: false,
        availabilityJson: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        createdAt: now,
        updatedAt: now,
      });
    } else if (role === 'CLINIC') {
      db.addClinic({
        id: `cln-${Date.now()}`,
        userId,
        name: clinicName || name,
        address: address || '123 Healthcare Blvd',
        city: city || 'Portland, OR',
        phone: phone || '+1 555-0100',
        email,
        registrationNo: registrationNo || `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        servicesJson: JSON.stringify(['Outpatient Care', 'Diagnostics', 'Specialist Consultations']),
        facilitiesJson: JSON.stringify(['Wheelchair Access', 'Parking', 'Pharmacy']),
        openingTime: '08:00',
        closingTime: '20:00',
        isVerified: false,
        rating: 5.0,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else if (role === 'LABORATORY') {
      db.addLaboratory({
        id: `lab-${Date.now()}`,
        userId,
        name: labName || name,
        address: address || '450 Diagnostic Way',
        city: city || 'Portland, OR',
        phone: phone || '+1 555-0200',
        email,
        licenseNo: licenseNo || `CLIA-${Math.floor(100000 + Math.random() * 900000)}`,
        accreditation: 'CLIA Verified Laboratory',
        isVerified: false,
        rating: 5.0,
        reviewCount: 0,
        turnaroundTimeNote: '24-48 hours',
        homeCollectionAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    logAudit(userId, 'USER_REGISTERED', 'USER', userId, { role, email });

    createNotification(
      userId,
      'Welcome to MediLink',
      `Your account has been created as ${role}. ${role !== 'PATIENT' && role !== 'ADMIN' ? 'Your profile credentials are pending verification by platform admin.' : 'You can now access your dashboard.'}`,
      'SYSTEM',
      '/'
    );

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        avatarUrl: newUser.avatarUrl,
        status: newUser.status
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Registration failed: ' + error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid email or password format.' });
    }

    const { email, password } = parseResult.data;
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended. Please contact platform administration.' });
    }

    logAudit(user.id, 'USER_LOGGED_IN', 'AUTH', user.id, { email: user.email });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Fetch role specific profile
    let profileData: any = null;
    if (user.role === 'PATIENT') {
      profileData = db.findPatientProfileByUserId(user.id);
    } else if (user.role === 'DOCTOR') {
      profileData = db.findDoctorProfileByUserId(user.id);
    } else if (user.role === 'CLINIC') {
      profileData = db.findClinicByUserId(user.id);
    } else if (user.role === 'LABORATORY') {
      profileData = db.findLaboratoryByUserId(user.id);
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status
      },
      profile: profileData
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    const user = db.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    let profileData: any = null;
    if (user.role === 'PATIENT') {
      profileData = db.findPatientProfileByUserId(user.id);
    } else if (user.role === 'DOCTOR') {
      profileData = db.findDoctorProfileByUserId(user.id);
    } else if (user.role === 'CLINIC') {
      profileData = db.findClinicByUserId(user.id);
    } else if (user.role === 'LABORATORY') {
      profileData = db.findLaboratoryByUserId(user.id);
    }

    const unreadCount = db.findNotificationsByUserId(user.id).filter(n => !n.isRead).length;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status
      },
      profile: profileData,
      unreadNotificationsCount: unreadCount
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user: ' + error.message });
  }
}
