import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData.js';
import {
  User,
  PatientProfile,
  DoctorProfile,
  Clinic,
  ClinicDoctor,
  Laboratory,
  DiagnosticTest,
  Appointment,
  Queue,
  QueueTicket,
  Referral,
  TestBooking,
  Sample,
  MedicalReport,
  Review,
  Notification,
  AuditLog
} from '../types/index.js';

interface DatabaseData {
  users: User[];
  patientProfiles: PatientProfile[];
  doctorProfiles: DoctorProfile[];
  clinics: Clinic[];
  clinicDoctors: ClinicDoctor[];
  laboratories: Laboratory[];
  diagnosticTests: DiagnosticTest[];
  appointments: Appointment[];
  queues: Queue[];
  queueTickets: QueueTicket[];
  referrals: Referral[];
  testBookings: TestBooking[];
  samples: Sample[];
  medicalReports: MedicalReport[];
  reviews: Review[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseData;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.users.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DB] Could not read existing db.json, generating seed data:', err);
    }

    const initial = getInitialSeedData();
    this.persistSync(initial);
    return initial;
  }

  private persistSync(data: DatabaseData) {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err);
    }
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.data);
    }, 150);
  }

  // --- Users ---
  public getUsers() { return this.data.users; }
  public findUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Patient Profiles ---
  public getPatientProfiles() { return this.data.patientProfiles; }
  public findPatientProfileByUserId(userId: string) {
    return this.data.patientProfiles.find(p => p.userId === userId);
  }
  public findPatientProfileById(id: string) {
    return this.data.patientProfiles.find(p => p.id === id);
  }
  public addPatientProfile(profile: PatientProfile) {
    this.data.patientProfiles.push(profile);
    this.save();
    return profile;
  }
  public updatePatientProfile(userId: string, updates: Partial<PatientProfile>) {
    const idx = this.data.patientProfiles.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      this.data.patientProfiles[idx] = { ...this.data.patientProfiles[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.patientProfiles[idx];
    }
    return null;
  }

  // --- Doctor Profiles ---
  public getDoctorProfiles() { return this.data.doctorProfiles; }
  public findDoctorProfileByUserId(userId: string) {
    return this.data.doctorProfiles.find(d => d.userId === userId);
  }
  public findDoctorProfileById(id: string) {
    return this.data.doctorProfiles.find(d => d.id === id);
  }
  public addDoctorProfile(profile: DoctorProfile) {
    this.data.doctorProfiles.push(profile);
    this.save();
    return profile;
  }
  public updateDoctorProfile(id: string, updates: Partial<DoctorProfile>) {
    const idx = this.data.doctorProfiles.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.doctorProfiles[idx] = { ...this.data.doctorProfiles[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.doctorProfiles[idx];
    }
    return null;
  }

  // --- Clinics ---
  public getClinics() { return this.data.clinics; }
  public findClinicByUserId(userId: string) {
    return this.data.clinics.find(c => c.userId === userId);
  }
  public findClinicById(id: string) {
    return this.data.clinics.find(c => c.id === id);
  }
  public addClinic(clinic: Clinic) {
    this.data.clinics.push(clinic);
    this.save();
    return clinic;
  }
  public updateClinic(id: string, updates: Partial<Clinic>) {
    const idx = this.data.clinics.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clinics[idx] = { ...this.data.clinics[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.clinics[idx];
    }
    return null;
  }

  // --- Laboratories ---
  public getLaboratories() { return this.data.laboratories; }
  public findLaboratoryByUserId(userId: string) {
    return this.data.laboratories.find(l => l.userId === userId);
  }
  public findLaboratoryById(id: string) {
    return this.data.laboratories.find(l => l.id === id);
  }
  public addLaboratory(lab: Laboratory) {
    this.data.laboratories.push(lab);
    this.save();
    return lab;
  }
  public updateLaboratory(id: string, updates: Partial<Laboratory>) {
    const idx = this.data.laboratories.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.laboratories[idx] = { ...this.data.laboratories[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.laboratories[idx];
    }
    return null;
  }

  // --- Diagnostic Tests ---
  public getDiagnosticTests() { return this.data.diagnosticTests; }
  public findDiagnosticTestById(id: string) {
    return this.data.diagnosticTests.find(t => t.id === id);
  }
  public getTestsByLabId(labId: string) {
    return this.data.diagnosticTests.filter(t => t.labId === labId);
  }
  public addDiagnosticTest(test: DiagnosticTest) {
    this.data.diagnosticTests.push(test);
    this.save();
    return test;
  }
  public updateDiagnosticTest(id: string, updates: Partial<DiagnosticTest>) {
    const idx = this.data.diagnosticTests.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.diagnosticTests[idx] = { ...this.data.diagnosticTests[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.diagnosticTests[idx];
    }
    return null;
  }
  public deleteDiagnosticTest(id: string) {
    const initialLen = this.data.diagnosticTests.length;
    this.data.diagnosticTests = this.data.diagnosticTests.filter(t => t.id !== id);
    this.save();
    return this.data.diagnosticTests.length < initialLen;
  }

  // --- Appointments ---
  public getAppointments() { return this.data.appointments; }
  public findAppointmentById(id: string) {
    return this.data.appointments.find(a => a.id === id);
  }
  public addAppointment(apt: Appointment) {
    this.data.appointments.push(apt);
    this.save();
    return apt;
  }
  public updateAppointment(id: string, updates: Partial<Appointment>) {
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.appointments[idx] = { ...this.data.appointments[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.appointments[idx];
    }
    return null;
  }

  // --- Queues ---
  public getQueues() { return this.data.queues; }
  public findQueueById(id: string) {
    return this.data.queues.find(q => q.id === id);
  }
  public findQueueByDoctorAndDate(doctorId: string, date: string) {
    return this.data.queues.find(q => q.doctorId === doctorId && q.date === date);
  }
  public addQueue(queue: Queue) {
    this.data.queues.push(queue);
    this.save();
    return queue;
  }
  public updateQueue(id: string, updates: Partial<Queue>) {
    const idx = this.data.queues.findIndex(q => q.id === id);
    if (idx !== -1) {
      this.data.queues[idx] = { ...this.data.queues[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.queues[idx];
    }
    return null;
  }

  // --- Queue Tickets ---
  public getQueueTickets() { return this.data.queueTickets; }
  public findQueueTicketsByQueueId(queueId: string) {
    return this.data.queueTickets.filter(t => t.queueId === queueId);
  }
  public findQueueTicketByAppointmentId(appointmentId: string) {
    return this.data.queueTickets.find(t => t.appointmentId === appointmentId);
  }
  public addQueueTicket(ticket: QueueTicket) {
    this.data.queueTickets.push(ticket);
    this.save();
    return ticket;
  }
  public updateQueueTicket(id: string, updates: Partial<QueueTicket>) {
    const idx = this.data.queueTickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.queueTickets[idx] = { ...this.data.queueTickets[idx], ...updates };
      this.save();
      return this.data.queueTickets[idx];
    }
    return null;
  }

  // --- Referrals ---
  public getReferrals() { return this.data.referrals; }
  public findReferralById(id: string) {
    return this.data.referrals.find(r => r.id === id);
  }
  public addReferral(ref: Referral) {
    this.data.referrals.push(ref);
    this.save();
    return ref;
  }
  public updateReferral(id: string, updates: Partial<Referral>) {
    const idx = this.data.referrals.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.referrals[idx] = { ...this.data.referrals[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.referrals[idx];
    }
    return null;
  }

  // --- Test Bookings ---
  public getTestBookings() { return this.data.testBookings; }
  public findTestBookingById(id: string) {
    return this.data.testBookings.find(b => b.id === id);
  }
  public addTestBooking(booking: TestBooking) {
    this.data.testBookings.push(booking);
    this.save();
    return booking;
  }
  public updateTestBooking(id: string, updates: Partial<TestBooking>) {
    const idx = this.data.testBookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.testBookings[idx] = { ...this.data.testBookings[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.testBookings[idx];
    }
    return null;
  }

  // --- Samples ---
  public getSamples() { return this.data.samples; }
  public findSampleByBookingId(bookingId: string) {
    return this.data.samples.find(s => s.testBookingId === bookingId);
  }
  public addSample(sample: Sample) {
    this.data.samples.push(sample);
    this.save();
    return sample;
  }
  public updateSample(id: string, updates: Partial<Sample>) {
    const idx = this.data.samples.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.samples[idx] = { ...this.data.samples[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.samples[idx];
    }
    return null;
  }

  // --- Medical Reports ---
  public getMedicalReports() { return this.data.medicalReports; }
  public findMedicalReportById(id: string) {
    return this.data.medicalReports.find(r => r.id === id);
  }
  public addMedicalReport(report: MedicalReport) {
    this.data.medicalReports.push(report);
    this.save();
    return report;
  }
  public updateMedicalReport(id: string, updates: Partial<MedicalReport>) {
    const idx = this.data.medicalReports.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.medicalReports[idx] = { ...this.data.medicalReports[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.medicalReports[idx];
    }
    return null;
  }

  // --- Reviews ---
  public getReviews() { return this.data.reviews; }
  public addReview(review: Review) {
    this.data.reviews.push(review);
    this.save();
    return review;
  }

  // --- Notifications ---
  public getNotifications() { return this.data.notifications; }
  public findNotificationsByUserId(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  public addNotification(notification: Notification) {
    this.data.notifications.push(notification);
    this.save();
    return notification;
  }
  public markNotificationAsRead(id: string, userId: string) {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.save();
      return notif;
    }
    return null;
  }
  public markAllNotificationsAsRead(userId: string) {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.save();
  }

  // --- Audit Logs ---
  public getAuditLogs() { return this.data.auditLogs; }
  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.push(log);
    this.save();
    return log;
  }

  // Reset to seed data
  public resetToSeed() {
    this.data = getInitialSeedData();
    this.persistSync(this.data);
    return true;
  }
}

export const db = new DatabaseStore();
