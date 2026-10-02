import { Request, Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { TestBooking, Sample, SampleStatus, BookingStatus } from '../types/index.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

export async function getTestBookings(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const allBookings = db.getTestBookings();
    const allTests = db.getDiagnosticTests();
    const allLabs = db.getLaboratories();
    const allPatients = db.getPatientProfiles();
    const allUsers = db.getUsers();
    const allSamples = db.getSamples();

    let list = allBookings;

    if (req.user.role === 'PATIENT') {
      const patient = db.findPatientProfileByUserId(req.user.userId);
      if (!patient) return res.json({ success: true, data: [] });
      list = list.filter(b => b.patientId === patient.id);
    } else if (req.user.role === 'LABORATORY') {
      const lab = db.findLaboratoryByUserId(req.user.userId);
      if (!lab) return res.json({ success: true, data: [] });
      list = list.filter(b => b.labId === lab.id);
    }

    const enriched = list.map(b => {
      const test = allTests.find(t => t.id === b.testId);
      const lab = allLabs.find(l => l.id === b.labId);
      const patientProf = allPatients.find(p => p.id === b.patientId);
      const patientUser = patientProf ? allUsers.find(u => u.id === patientProf.userId) : null;
      const sample = allSamples.find(s => s.testBookingId === b.id);

      return {
        ...b,
        testName: test ? test.name : 'Diagnostic Test',
        testCode: test?.code,
        testCategory: test?.category,
        testSampleType: test?.sampleType,
        laboratoryName: lab ? lab.name : 'Precision Labs',
        laboratoryAddress: lab?.address,
        laboratoryPhone: lab?.phone,
        patientName: patientUser ? patientUser.name : 'Patient',
        patientPhone: patientUser?.phone,
        patientAddress: patientProf?.address,
        sample: sample ? {
          id: sample.id,
          barcode: sample.barcode,
          sampleType: sample.sampleType,
          status: sample.status,
          temperature: sample.temperature,
          collectedAt: sample.collectedAt,
          collectedBy: sample.collectedBy
        } : null
      };
    });

    enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve test bookings: ' + error.message });
  }
}

export async function createTestBooking(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, error: 'Only patients can book diagnostic tests.' });
    }

    const patient = db.findPatientProfileByUserId(req.user.userId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found.' });
    }

    const { testId, referralId, collectionType, scheduledDate, scheduledTimeSlot, collectionAddress } = req.body;
    if (!testId || !scheduledDate || !scheduledTimeSlot) {
      return res.status(400).json({ success: false, error: 'Test, scheduled date, and time slot are required.' });
    }

    const test = db.findDiagnosticTestById(testId);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Diagnostic test not found.' });
    }

    const lab = db.findLaboratoryById(test.labId);
    const bookingNumber = `TB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const totalAmount = test.discountPrice !== undefined && test.discountPrice !== null ? test.discountPrice : test.price;

    const newBooking: TestBooking = {
      id: `tb-${Date.now()}`,
      bookingNumber,
      patientId: patient.id,
      labId: test.labId,
      testId: test.id,
      referralId: referralId || null,
      collectionType: collectionType === 'HOME_COLLECTION' ? 'HOME_COLLECTION' : 'WALK_IN',
      scheduledDate,
      scheduledTimeSlot,
      collectionAddress: collectionAddress || (collectionType === 'HOME_COLLECTION' ? patient.address : lab?.address),
      status: 'CONFIRMED',
      totalAmount,
      createdAt: now,
      updatedAt: now,
    };

    db.addTestBooking(newBooking);

    // Auto-create sample tracking record with barcode
    const barcode = `SMP-BC-${Math.floor(100000 + Math.random() * 900000)}-${test.code.slice(0, 3)}`;
    const newSample: Sample = {
      id: `smp-${Date.now()}`,
      testBookingId: newBooking.id,
      barcode,
      sampleType: test.sampleType,
      collectedAt: newBooking.collectionType === 'WALK_IN' ? now : undefined,
      collectedBy: newBooking.collectionType === 'WALK_IN' ? 'Phlebotomy Technician' : undefined,
      status: 'COLLECTED',
      temperature: '4°C Controlled',
      updatedAt: now,
    };

    db.addSample(newSample);

    // If booking was based on referral, mark referral BOOKED
    if (referralId) {
      db.updateReferral(referralId, { status: 'BOOKED' });
    }

    // Notify patient
    createNotification(
      req.user.userId,
      'Diagnostic Booking Confirmed',
      `Your booking for ${test.name} (${bookingNumber}) is confirmed for ${scheduledDate}. Sample Barcode: ${barcode}.`,
      'BOOKING',
      '/patient/lab-bookings'
    );

    // Notify laboratory
    if (lab) {
      createNotification(
        lab.userId,
        'New Test Booking Received',
        `New booking ${bookingNumber} for ${test.name} scheduled for ${scheduledDate} (${newBooking.collectionType}).`,
        'BOOKING',
        '/laboratory/bookings'
      );
    }

    logAudit(req.user.userId, 'TEST_BOOKED', 'TEST_BOOKING', newBooking.id, {
      bookingNumber,
      testId: test.id,
      totalAmount
    });

    return res.status(201).json({
      success: true,
      message: 'Diagnostic test booked successfully',
      data: {
        ...newBooking,
        sample: newSample
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to book test: ' + error.message });
  }
}

export async function updateTestBookingStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, sampleStatus, temperature, rejectionReason } = req.body;

    const booking = db.findTestBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    const updates: Partial<TestBooking> = {};
    if (status) updates.status = status as BookingStatus;

    const updatedBooking = db.updateTestBooking(id, updates);

    // Update sample if provided
    const sample = db.findSampleByBookingId(id);
    if (sample && (sampleStatus || temperature || rejectionReason)) {
      db.updateSample(sample.id, {
        ...(sampleStatus ? { status: sampleStatus as SampleStatus } : {}),
        ...(temperature ? { temperature } : {}),
        ...(rejectionReason ? { rejectionReason } : {})
      });
    }

    const patient = db.findPatientProfileById(booking.patientId);
    if (patient && status) {
      createNotification(
        patient.userId,
        'Sample Status Update',
        `Your test booking ${booking.bookingNumber} is now: ${status} (Sample: ${sampleStatus || 'Processing'}).`,
        'SAMPLE',
        '/patient/lab-bookings'
      );
    }

    return res.json({ success: true, message: 'Status updated', data: updatedBooking });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update test booking: ' + error.message });
  }
}
