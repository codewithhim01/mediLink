const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('medilink_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Network request failed', response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getCurrentUser: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Doctors
  getDoctors: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any>(`/doctors${qs}`);
  },
  getDoctorById: (id: string) => request<any>(`/doctors/${id}`),
  updateDoctorProfile: (body: any) => request<any>('/doctors/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Clinics
  getClinics: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/clinics${qs}`);
  },
  getClinicById: (id: string) => request<any>(`/clinics/${id}`),
  updateClinicProfile: (body: any) => request<any>('/clinics/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Laboratories & Diagnostic Tests
  getLaboratories: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/laboratories${qs}`);
  },
  getLaboratoryById: (id: string) => request<any>(`/laboratories/${id}`),
  getDiagnosticTests: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any>(`/diagnostic-tests${qs}`);
  },
  createDiagnosticTest: (body: any) => request<any>('/diagnostic-tests', { method: 'POST', body: JSON.stringify(body) }),
  updateDiagnosticTest: (id: string, body: any) => request<any>(`/diagnostic-tests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDiagnosticTest: (id: string) => request<any>(`/diagnostic-tests/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: () => request<any>('/appointments'),
  createAppointment: (body: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointmentStatus: (id: string, body: any) => request<any>(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Queues
  getDoctorQueue: (doctorId: string) => request<any>(`/queues/doctor/${doctorId}`),
  callNextPatient: (queueId: string) => request<any>(`/queues/${queueId}/call-next`, { method: 'PUT' }),
  updateQueueDelay: (queueId: string, body: any) => request<any>(`/queues/${queueId}/delay`, { method: 'PUT', body: JSON.stringify(body) }),

  // Referrals
  getReferrals: () => request<any>('/referrals'),
  createReferral: (body: any) => request<any>('/referrals', { method: 'POST', body: JSON.stringify(body) }),

  // Test Bookings
  getTestBookings: () => request<any>('/test-bookings'),
  createTestBooking: (body: any) => request<any>('/test-bookings', { method: 'POST', body: JSON.stringify(body) }),
  updateTestBookingStatus: (id: string, body: any) => request<any>(`/test-bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Medical Reports
  getReports: () => request<any>('/reports'),
  getReportById: (id: string) => request<any>(`/reports/${id}`),
  uploadLabReport: (body: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(body) }),
  toggleShareReport: (id: string, isSharedWithDoctor: boolean) => request<any>(`/reports/${id}/share`, { method: 'PUT', body: JSON.stringify({ isSharedWithDoctor }) }),

  // AI Report Assistant
  analyzeReport: (body: { reportText: string; fileName?: string; saveAsReport?: boolean }) =>
    request<any>('/ai/analyze-report', { method: 'POST', body: JSON.stringify(body) }),

  // Reviews
  getReviews: (targetType: string, targetId: string) => request<any>(`/reviews/${targetType}/${targetId}`),
  createReview: (body: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getVerifications: () => request<any>('/admin/verifications'),
  updateVerificationStatus: (entityType: string, id: string, body: any) => request<any>(`/admin/verifications/${entityType}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getAdminUsers: () => request<any>('/admin/users'),
  updateUserStatus: (id: string, status: string) => request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
  resetDemoData: () => request<any>('/admin/reset-demo', { method: 'POST' }),
};
