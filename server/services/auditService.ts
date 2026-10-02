import { db } from '../db/store.js';
import { AuditLog } from '../types/index.js';

export function logAudit(
  userId: string | undefined,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  const audit: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress: ipAddress || '127.0.0.1',
    userAgent: userAgent || 'MediLink-Client/1.0',
    detailsJson: details ? JSON.stringify(details) : '{}',
    createdAt: new Date().toISOString()
  };

  db.addAuditLog(audit);
}
