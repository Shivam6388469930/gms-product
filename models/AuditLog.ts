import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  action: string;

  resource: string;
  resourceId?: string;

  description?: string;

  changes?: {
    before?: unknown;
    after?: unknown;
  };

  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    actorName: {
      type: String,
      trim: true,
    },

    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    actorRole: {
      type: String,
      trim: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    resource: {
      type: String,
      required: true,
      index: true,
    },

    resourceId: {
      type: String,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    changes: {
      before: {
        type: Schema.Types.Mixed,
      },

      after: {
        type: Schema.Types.Mixed,
      },
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({
  actorId: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  resource: 1,
  resourceId: 1,
  createdAt: -1,
});

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;