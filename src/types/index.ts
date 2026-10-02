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

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt?: string;
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
  medicalHistoryJson?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialty: string;
  subSpecialty?: string;
  experienceYears: number;
  qualification: string;
  licenseNumber: string;
  consultationFee: number;
  bio?: string;
  consultationDuration: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  availability: string[];
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
  distanceMiles?: number;
  phone: string;
  email: string;
  registrationNo: string;
  services: string[];
  facilities: string[];
  openingTime: string;
  closingTime: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
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
  distanceMiles?: number;
  phone: string;
  email: string;
  licenseNo: string;
  accreditation?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  turnaroundTimeNote: string;
  homeCollectionAvailable: boolean;
  testCount?: number;
  minTestPrice?: number;
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
  effectivePrice?: number;
  preparationInstructions?: string;
  description?: string;
  parameters: Array<{ name: string; unit: string; normalRange: string }>;
  isAvailable: boolean;
  laboratoryName?: string;
  laboratoryAddress?: string;
  laboratoryRating?: number;
  laboratoryArea?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  homeCollectionAvailable?: boolean;
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
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  clinicName?: string;
  clinicAddress?: string;
  queueTicket?: {
    id: string;
    queueId: string;
    tokenNumber: number;
    estimatedTime: string;
    status: QueueTicketStatus;
  } | null;
  createdAt: string;
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
}

export interface QueueTicket {
  id: string;
  queueId: string;
  appointmentId: string;
  patientId: string;
  tokenNumber: number;
  estimatedTime: string;
  status: QueueTicketStatus;
  patientName?: string;
  patientPhone?: string;
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
  doctorName?: string;
  doctorSpecialty?: string;
  patientName?: string;
  labName?: string;
  testName?: string;
  testPrice?: number;
  createdAt: string;
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
  testName?: string;
  testCode?: string;
  testCategory?: string;
  testSampleType?: string;
  laboratoryName?: string;
  laboratoryPhone?: string;
  patientName?: string;
  patientPhone?: string;
  sample?: {
    id: string;
    barcode: string;
    sampleType: string;
    status: SampleStatus;
    temperature?: string;
    collectedAt?: string;
    collectedBy?: string;
  } | null;
  createdAt: string;
}

export interface ExtractedFact {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'LOW' | 'NORMAL' | 'HIGH' | 'BORDERLINE' | 'CRITICAL' | 'UNKNOWN';
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
  extractedFacts: ExtractedFact[];
  aiAnalysis?: any;
  status: 'DRAFT' | 'PUBLISHED' | 'AMENDED';
  publishedAt: string;
  isSharedWithDoctor: boolean;
  laboratoryName?: string;
  doctorName?: string;
  patientName?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  patientId: string;
  patientName?: string;
  targetType: 'DOCTOR' | 'CLINIC' | 'LABORATORY';
  targetId: string;
  rating: number;
  comment: string;
  isVerifiedVisit: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'QUEUE' | 'BOOKING' | 'SAMPLE' | 'REPORT' | 'VERIFICATION' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AIAnalysisResult {
  reportDate?: string;
  testNames: string[];
  extractedFacts: ExtractedFact[];
  interpretation: {
    plainLanguageSummary: string;
    abnormalFindings: string[];
    possibleGeneralMeanings: string;
    concerningFindingsNotice?: string;
    relevantSpecialties: string[];
    suggestedQuestionsForDoctor: string[];
  };
  recommendations: {
    matchedDoctors: Array<{
      doctorId: string;
      doctorName: string;
      specialty: string;
      subSpecialty?: string;
      clinicName: string;
      clinicAddress: string;
      fees: number;
      rating: number;
      reviewCount: number;
      availability: string[];
      location: string;
    }>;
    matchedLabTests: Array<{
      testId: string;
      testName: string;
      category: string;
      price: number;
      discountPrice?: number;
      turnaroundHours: number;
      turnaroundNote: string;
      labId: string;
      labName: string;
      labAddress: string;
      homeCollectionAvailable: boolean;
      location: string;
    }>;
  };
  disclaimer: string;
  providerUsed: string;
}
