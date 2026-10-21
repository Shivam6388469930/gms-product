import mongoose from "mongoose";
import AuditLog from "@/models/AuditLog";
import { connectDB } from "@/config/db";

interface AuditLogInput {
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  action: string;

  resource: string;
  resourceId?: string;

  description?: string;

  before?: unknown;
  after?: unknown;

  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogInput) {
  await connectDB();

  const auditLog = await AuditLog.create({
    actorId:
      data.actorId && mongoose.Types.ObjectId.isValid(data.actorId)
        ? new mongoose.Types.ObjectId(data.actorId)
        : undefined,

    actorName: data.actorName,
    actorEmail: data.actorEmail,
    actorRole: data.actorRole,

    action: data.action,

    resource: data.resource,
    resourceId: data.resourceId,

    description: data.description,

    changes: {
      before: data.before,
      after: data.after,
    },

    metadata: data.metadata || {},

    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return auditLog;
}