/**
 * Form validation utilities and regular expressions for MediLink
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Supports Indian 10-digit mobile numbers with optional +91, 91, or 0 prefix and spaces/dashes
export const PHONE_REGEX = /^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
}

export function validatePassword(password: string, minLength = 6): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  return null;
}

export function validateName(name: string, label = 'Full name'): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }
  if (trimmed.length < 2) {
    return `${label} must be at least 2 characters long.`;
  }
  return null;
}

export function validatePhone(phone: string, required = false): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return required ? 'Phone number is required.' : null;
  }
  // Remove non-digit characters for length check
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    return 'Please enter a valid 10-digit mobile number.';
  }
  return null;
}

export function validateRequired(value: string | number | undefined | null, fieldName: string): string | null {
  if (value === undefined || value === null) {
    return `${fieldName} is required.`;
  }
  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName} is required.`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return `${fieldName} is required.`;
  }
  if (trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters.`;
  }
  return null;
}

export function validateDateNotPast(dateStr: string, fieldName = 'Consultation date'): string | null {
  if (!dateStr) {
    return `${fieldName} is required.`;
  }
  const selectedDate = new Date(dateStr);
  if (isNaN(selectedDate.getTime())) {
    return 'Please choose a valid calendar date.';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    return `${fieldName} cannot be in the past.`;
  }
  return null;
}
