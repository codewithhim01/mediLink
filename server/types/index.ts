export type Role = 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'LABORATORY' | 'ADMIN';

export type UserStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';

export type AppointmentStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentType = 'IN_PERSON' | 'TELECONSULT';

export type QueueStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type QueueTicketStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'REPORT_READY' | 'CANCELLED';
export type SampleStatus = 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED_AT_LAB' | 'ANALYZING' | 'COMPLETED' | 'REJECTED';

export type ReferralPriority = 'NORMAL' | 'URGENT';
export type ReferralStatus = 'PENDING' | 'BOOKED' | 'COMPLETED' | 'EXPIRED';

export type TargetType = 'DOCTOR' | 'CLINIC' | 'LABORATORY';
export type NotificationType = 'APPOINTMENT' | 'QUEUE' | 'BOOKING' | 'SAMPLE' | 'REPORT' | 'VERIFICATION' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  address?: string;
  medicalHistoryJson?: string; // stringified array
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  registrationNo: string;
  servicesJson: string; // stringified array
  facilitiesJson: string; // stringified array
  openingTime: string;
  closingTime: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialty: string;
  subSpecialty?: string;
  experienceYears: number;
  qualification: string;
  licenseNumber: string;
  consultationFee: number;
  bio?: string;
  consultationDuration: number; // minutes
  rating: number;
  reviewCount: number;
  clinicId?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  availabilityJson: string; // stringified array of days/slots
  createdAt: string;
  updatedAt: string;
}

export interface ClinicDoctor {
  id: string;
  clinicId: string;
  doctorId: string;
  daysAvailableJson: string;
  roomNo?: string;
  status: string;
  createdAt: string;
}

export interface Laboratory {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  licenseNo: string;
  accreditation?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  turnaroundTimeNote: string;
  homeCollectionAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticTest {
  id: string;
  labId: string;
  name: string;
  code: string;
  category: string;
  sampleType: string;
  turnaroundHours: number;
  price: number;
  discountPrice?: number;
  preparationInstructions?: string;
  description?: string;
  parametersJson: string; // stringified array of parameters
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;
  date: string;
  timeSlot: string;
  type: AppointmentType;
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
  feePaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Queue {
  id: string;
  doctorId: string;
  clinicId?: string;
  date: string;
  currentTokenNumber: number;
  status: QueueStatus;
  averageConsultationMin: number;
  delayMinutes: number;
  updatedAt: string;
}

export interface QueueTicket {
  id: string;
  queueId: string;
  appointmentId: string;
  patientId: string;
  tokenNumber: number;
  estimatedTime: string;
  status: QueueTicketStatus;
  checkInTime?: string;
  calledTime?: string;
  completedTime?: string;
}

export interface Referral {
  id: string;
  referralCode: string;
  doctorId: string;
  patientId: string;
  labId?: string;
  testId?: string;
  notes?: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TestBooking {
  id: string;
  bookingNumber: string;
  patientId: string;
  labId: string;
  testId: string;
  referralId?: string;
  collectionType: 'WALK_IN' | 'HOME_COLLECTION';
  scheduledDate: string;
  scheduledTimeSlot: string;
  collectionAddress?: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sample {
  id: string;
  testBookingId: string;
  barcode: string;
  sampleType: string;
  collectedAt?: string;
  collectedBy?: string;
  status: SampleStatus;
  temperature?: string;
  rejectionReason?: string;
  updatedAt: string;
}

export interface MedicalReport {
  id: string;
  testBookingId?: string;
  patientId: string;
  labId?: string;
  doctorId?: string;
  reportTitle: string;
  testCategory: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  summary?: string;
  extractedFactsJson?: string;
  aiAnalysisJson?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'AMENDED';
  publishedAt: string;
  isSharedWithDoctor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  patientId: string;
  targetType: TargetType;
  targetId: string;
  rating: number;
  comment: string;
  isVerifiedVisit: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  detailsJson?: string;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}
